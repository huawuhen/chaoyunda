import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { Agent } from "undici";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT || 4173);
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 200);
const tkhubBaseUrl = (process.env.TKHUB_API_BASE_URL || "https://api.tkhub.ai").replace(/\/$/, "");
const muapiBaseUrl = (process.env.MUAPI_BASE_URL || "https://api.muapi.ai/api/v1").replace(/\/$/, "");
const s3Endpoint = (process.env.S3_ENDPOINT || "").replace(/\/$/, "");
const s3Bucket = process.env.S3_BUCKET || "redith-assets";
const s3Region = process.env.S3_REGION || "us-east-1";
const s3ForcePathStyle = readBooleanEnv("S3_FORCE_PATH_STYLE", true);
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.access_key_id;
const s3SecretAccessKey =
  process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.secret_access_key;
const signedUrlExpiresIn = Math.min(Number(process.env.S3_SIGNED_URL_EXPIRES_SECONDS || 604800), 604800);
const upstreamConnectTimeoutMs = readPositiveInt("UPSTREAM_CONNECT_TIMEOUT_MS", 30000);
const upstreamRequestTimeoutMs = readPositiveInt("UPSTREAM_REQUEST_TIMEOUT_MS", 60000);
const upstreamFetchRetries = readNonNegativeInt("UPSTREAM_FETCH_RETRIES", 1);
const tkhubConnectTimeoutMs = readPositiveInt("TKHUB_CONNECT_TIMEOUT_MS", upstreamConnectTimeoutMs);
const tkhubRequestTimeoutMs = readPositiveInt("TKHUB_REQUEST_TIMEOUT_MS", upstreamRequestTimeoutMs);
const tkhubFetchRetries = readNonNegativeInt("TKHUB_FETCH_RETRIES", upstreamFetchRetries);
const muapiConnectTimeoutMs = readPositiveInt("MUAPI_CONNECT_TIMEOUT_MS", upstreamConnectTimeoutMs);
const muapiRequestTimeoutMs = readPositiveInt("MUAPI_REQUEST_TIMEOUT_MS", upstreamRequestTimeoutMs);
const muapiFetchRetries = readNonNegativeInt("MUAPI_FETCH_RETRIES", upstreamFetchRetries);
const upstreamLogVerbose = process.env.UPSTREAM_LOG_VERBOSE === "1";

const tkhubDispatcher = new Agent({ connect: { timeout: tkhubConnectTimeoutMs } });
const muapiDispatcher = new Agent({ connect: { timeout: muapiConnectTimeoutMs } });

const requiredEnv = ["TKHUB_API_KEY", "MUAPI_API_KEY", "S3_ENDPOINT"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (!s3AccessKeyId) missingEnv.push("S3_ACCESS_KEY_ID");
if (!s3SecretAccessKey) missingEnv.push("S3_SECRET_ACCESS_KEY");
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const s3Client = new S3Client({
  endpoint: s3Endpoint,
  region: s3Region,
  forcePathStyle: s3ForcePathStyle,
  credentials: {
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
  },
});
let ensureBucketPromise;

const app = express();
app.use(express.json({ limit: "2mb" }));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadMb * 1024 * 1024,
  },
});

function inferKind(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

function normalizeUploadFilename(filename = "") {
  const fixed = Buffer.from(filename, "latin1").toString("utf8");
  const looksMojibake = /[ÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßà-ÿ]/.test(filename);
  const fixedLooksReadable = !fixed.includes("�") && /[\u3400-\u9fff]/.test(fixed);
  return looksMojibake && fixedLooksReadable ? fixed : filename;
}

function sanitizeObjectFilename(filename = "") {
  return normalizeUploadFilename(filename)
    .replace(/[\\/#?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120) || "upload.bin";
}

function buildObjectKey(file) {
  const date = new Date().toISOString().slice(0, 10);
  const kind = inferKind(file.mimetype);
  return `uploads/${kind}/${date}/${Date.now()}-${randomUUID()}-${sanitizeObjectFilename(file.originalname)}`;
}

function formatUploadError(error) {
  if (error?.code === "LIMIT_FILE_SIZE") {
    return `文件超过本地上传限制，请压缩后再试，或在 .env 中调大 MAX_UPLOAD_MB。当前限制：${maxUploadMb}MB。`;
  }

  const message = error?.message || "";
  const status = error?.$metadata?.httpStatusCode || error?.$response?.statusCode;
  const storageReturnedHtml = /Expected closing tag|Deserialization error|<html|<body|<hr/i.test(message);
  if (storageReturnedHtml) {
    const statusText = status ? `HTTP ${status}` : "非标准错误响应";
    return `S3 存储端点返回了 ${statusText}，不是标准 S3 XML 错误。通常是 S3 服务或前置反向代理限制了上传体积，请调高存储服务/网关的最大上传大小，或压缩文件后再试。`;
  }

  if (status === 413) {
    return "S3 存储端点拒绝了这个文件：文件体积超过存储服务或反向代理允许的最大上传大小。";
  }

  return message || "S3 上传失败。";
}

function missingTkHubKey() {
  return !process.env.TKHUB_API_KEY || process.env.TKHUB_API_KEY.includes("请在这里替换");
}

function missingMuApiKey() {
  return !process.env.MUAPI_API_KEY || process.env.MUAPI_API_KEY.includes("请在这里替换");
}

function readPositiveInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function readNonNegativeInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function readBooleanEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return /^(1|true|yes|on)$/i.test(value);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFetchErrorCode(error) {
  if (typeof error?.cause?.code === "string") return error.cause.code;
  if (typeof error?.code === "string") return error.code;
  return error?.name || "FETCH_FAILED";
}

function isTimeoutFetchError(error) {
  const code = getFetchErrorCode(error);
  return (
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "UND_ERR_HEADERS_TIMEOUT" ||
    code === "UND_ERR_BODY_TIMEOUT" ||
    code === "AbortError" ||
    code === "TimeoutError"
  );
}

function isRetryableFetchError(error) {
  const code = getFetchErrorCode(error);
  return (
    error?.message === "fetch failed" ||
    isTimeoutFetchError(error) ||
    ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"].includes(code)
  );
}

function createUpstreamFetchError(provider, url, error, attempts, timeoutMs) {
  const code = getFetchErrorCode(error);
  const host = new URL(url).host;
  const timedOut = isTimeoutFetchError(error);
  const status = timedOut ? 504 : 502;
  const reason = timedOut ? `连接超时，已等待 ${timeoutMs}ms` : "网络请求失败";
  const message = `${provider} ${reason}：当前服务器无法连接 ${host}。请检查服务器网络、DNS/出口代理，或稍后重试。`;
  const upstreamError = new Error(message, { cause: error });
  upstreamError.name = "UpstreamFetchError";
  upstreamError.status = status;
  upstreamError.clientMessage = message;
  upstreamError.code = code;
  upstreamError.provider = provider;
  upstreamError.url = url;
  upstreamError.attempts = attempts;
  return upstreamError;
}

async function fetchUpstreamJson(provider, url, options = {}, config) {
  const attempts = Math.max(config.retries + 1, 1);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        dispatcher: config.dispatcher,
        signal: AbortSignal.timeout(config.requestTimeoutMs),
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text || `${provider} returned an empty response.` };
      }
      return { response, data };
    } catch (error) {
      if (!isRetryableFetchError(error) || attempt >= attempts) {
        throw createUpstreamFetchError(provider, url, error, attempt, config.requestTimeoutMs);
      }
      await delay(Math.min(500 * attempt, 1500));
    }
  }
}

function logRouteError(error) {
  if (error?.name === "UpstreamFetchError") {
    console.error(
      `[${error.provider}] ${error.code}: ${error.message} (attempts=${error.attempts}, url=${error.url})`,
    );
    if (upstreamLogVerbose) console.error(error.cause || error);
    return;
  }
  console.error(error);
}

function sendJsonError(res, error, fallback) {
  const status = Number(error?.status) || 500;
  const payload = {
    error: error?.clientMessage || error?.message || fallback,
  };
  if (error?.code) payload.code = error.code;
  res.status(status).json(payload);
}

async function proxyTkHub(pathname, options = {}) {
  return fetchUpstreamJson("TkHub", `${tkhubBaseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TKHUB_API_KEY}`,
      ...(options.headers || {}),
    },
  }, {
    dispatcher: tkhubDispatcher,
    requestTimeoutMs: tkhubRequestTimeoutMs,
    retries: tkhubFetchRetries,
  });
}

async function proxyMuApi(pathname, options = {}) {
  return fetchUpstreamJson("MuAPI", `${muapiBaseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.MUAPI_API_KEY,
      ...(options.headers || {}),
    },
  }, {
    dispatcher: muapiDispatcher,
    requestTimeoutMs: muapiRequestTimeoutMs,
    retries: muapiFetchRetries,
  });
}

function stripClientFields(body) {
  const { provider, model, ...payload } = body || {};
  return payload;
}

function stripProviderField(body) {
  const { provider, ...payload } = body || {};
  return payload;
}

async function ensureS3Bucket() {
  if (!ensureBucketPromise) {
    ensureBucketPromise = (async () => {
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: s3Bucket }));
      } catch (error) {
        const status = error?.$metadata?.httpStatusCode;
        if (status !== 404 && error?.name !== "NotFound" && error?.name !== "NoSuchBucket") {
          throw error;
        }
        await s3Client.send(new CreateBucketCommand({ Bucket: s3Bucket }));
      }
    })();
  }
  return ensureBucketPromise;
}

async function uploadToS3(file) {
  await ensureS3Bucket();
  const key = buildObjectKey(file);
  const contentType = file.mimetype || "application/octet-stream";
  await s3Client.send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
    }),
  );
  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      ResponseContentType: contentType,
    }),
    { expiresIn: signedUrlExpiresIn },
  );
  return { key, url };
}

app.post("/api/video/generations", async (req, res) => {
  try {
    if (req.body?.provider === "muapi-i2v" || req.body?.provider === "muapi-t2v") {
      if (missingMuApiKey()) {
        res.status(500).json({ error: "请先在 .env 中配置 MUAPI_API_KEY，然后重启本地服务。" });
        return;
      }
      const endpoint = req.body.provider === "muapi-t2v" ? "/seedance-v1.5-pro-t2v" : "/seedance-v1.5-pro-i2v";
      const { response, data } = await proxyMuApi(endpoint, {
        method: "POST",
        body: JSON.stringify(stripClientFields(req.body)),
      });
      res.status(response.status).json(data);
      return;
    }

    if (missingTkHubKey()) {
      res.status(500).json({ error: "请先在 .env 中配置 TKHUB_API_KEY，然后重启本地服务。" });
      return;
    }
    const { response, data } = await proxyTkHub("/v1/video/generations", {
      method: "POST",
      body: JSON.stringify(stripProviderField(req.body)),
    });
    res.status(response.status).json(data);
  } catch (error) {
    logRouteError(error);
    sendJsonError(res, error, "视频生成请求失败。");
  }
});

app.get("/api/video/generations/:taskId", async (req, res) => {
  try {
    if (req.query.provider === "muapi-i2v" || req.query.provider === "muapi-t2v") {
      if (missingMuApiKey()) {
        res.status(500).json({ error: "请先在 .env 中配置 MUAPI_API_KEY，然后重启本地服务。" });
        return;
      }
      const { response, data } = await proxyMuApi(`/predictions/${encodeURIComponent(req.params.taskId)}/result`, {
        method: "GET",
      });
      res.status(response.status).json(data);
      return;
    }

    if (missingTkHubKey()) {
      res.status(500).json({ error: "请先在 .env 中配置 TKHUB_API_KEY，然后重启本地服务。" });
      return;
    }
    const { response, data } = await proxyTkHub(`/v1/video/generations/${encodeURIComponent(req.params.taskId)}`, {
      method: "GET",
    });
    res.status(response.status).json(data);
  } catch (error) {
    logRouteError(error);
    sendJsonError(res, error, "视频任务查询失败。");
  }
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "请选择要上传的文件。" });
      return;
    }

    const asset = await uploadToS3(req.file);

    res.json({
      key: asset.key,
      url: asset.url,
      src: asset.key,
      name: normalizeUploadFilename(req.file.originalname),
      size: req.file.size,
      mimeType: req.file.mimetype,
      kind: inferKind(req.file.mimetype),
      provider: "s3",
      bucket: s3Bucket,
    });
  } catch (error) {
    console.error(error);
    res.status(error?.code === "LIMIT_FILE_SIZE" ? 413 : 500).json({ error: formatUploadError(error) });
  }
});

app.get("/api/download", async (req, res) => {
  try {
    const url = String(req.query.url || "");
    if (!/^https?:\/\//i.test(url)) {
      res.status(400).send("Invalid video URL.");
      return;
    }

    const response = await fetch(url);
    if (!response.ok || !response.body) {
      res.status(response.status || 502).send("Video download failed.");
      return;
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="redith-video-${Date.now()}.mp4"`);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Video download failed.");
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/app.js", (_req, res) => {
  res.sendFile(path.join(__dirname, "app.js"));
});
app.get("/styles.css", (_req, res) => {
  res.sendFile(path.join(__dirname, "styles.css"));
});
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use((error, _req, res, next) => {
  if (!error) {
    next();
    return;
  }
  if (error?.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: formatUploadError(error) });
    return;
  }
  next(error);
});

app.listen(port, () => {
  console.log(`Redith Seedance console running at http://localhost:${port}/`);
});
