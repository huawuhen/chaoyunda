import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT || 4173);
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 200);
const tkhubBaseUrl = (process.env.TKHUB_API_BASE_URL || "https://api.tkhub.ai").replace(/\/$/, "");
const muapiBaseUrl = (process.env.MUAPI_BASE_URL || "https://api.muapi.ai/api/v1").replace(/\/$/, "");
const imageHostBaseUrl = (process.env.IMAGE_HOST_BASE_URL || "https://tuchuang.huawuhen.online").replace(/\/$/, "");
const imageHostUploadUrl = process.env.IMAGE_HOST_UPLOAD_URL || `${imageHostBaseUrl}/upload`;

const requiredEnv = ["TKHUB_API_KEY", "MUAPI_API_KEY", "IMAGE_HOST_BASE_URL", "IMAGE_HOST_UPLOAD_URL"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

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

function missingTkHubKey() {
  return !process.env.TKHUB_API_KEY || process.env.TKHUB_API_KEY.includes("请在这里替换");
}

function missingMuApiKey() {
  return !process.env.MUAPI_API_KEY || process.env.MUAPI_API_KEY.includes("请在这里替换");
}

async function proxyTkHub(pathname, options = {}) {
  const response = await fetch(`${tkhubBaseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TKHUB_API_KEY}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "TkHub returned an empty response." };
  }
  return { response, data };
}

async function proxyMuApi(pathname, options = {}) {
  const response = await fetch(`${muapiBaseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.MUAPI_API_KEY,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "MuAPI returned an empty response." };
  }
  return { response, data };
}

function stripClientFields(body) {
  const { provider, model, ...payload } = body || {};
  return payload;
}

function stripProviderField(body) {
  const { provider, ...payload } = body || {};
  return payload;
}

function toAbsoluteAssetUrl(src) {
  if (!src) return "";
  return new URL(src, imageHostBaseUrl).toString();
}

function parseImageHostResponse(data) {
  const first = Array.isArray(data) ? data[0] : data;
  const src = first?.src || first?.url || first?.path;
  const url = toAbsoluteAssetUrl(src);
  if (!url) {
    throw new Error("图床响应中没有找到 src/url/path 字段。");
  }
  return { src, url };
}

async function uploadToImageHost(file) {
  const form = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" });
  form.append("file", blob, normalizeUploadFilename(file.originalname));

  const response = await fetch(imageHostUploadUrl, {
    method: "POST",
    body: form,
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`图床响应不是 JSON：${text.slice(0, 160)}`);
  }
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `图床上传失败 ${response.status}`);
  }
  return parseImageHostResponse(data);
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
    console.error(error);
    res.status(500).json({ error: error.message || "TkHub 请求失败。" });
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
    console.error(error);
    res.status(500).json({ error: error.message || "TkHub 查询失败。" });
  }
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "请选择要上传的文件。" });
      return;
    }

    const asset = await uploadToImageHost(req.file);

    res.json({
      key: asset.src,
      url: asset.url,
      src: asset.src,
      name: normalizeUploadFilename(req.file.originalname),
      size: req.file.size,
      mimeType: req.file.mimetype,
      kind: inferKind(req.file.mimetype),
      provider: "image-host",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "图床上传失败。" });
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

app.listen(port, () => {
  console.log(`Redith Seedance console running at http://localhost:${port}/`);
});
