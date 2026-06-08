const TKHUB_MODEL = "bytedance/seedance-2.0";
const MUAPI_I2V_MODEL = "seedance-v1.5-pro-i2v";
const MUAPI_T2V_MODEL = "seedance-v1.5-pro-t2v";
const MUAPI_GEMINI_OMNI_MODEL = "gemini-omni-image-to-video";
const PREVIEW_STRING_LIMIT = 180;
const HISTORY_KEY = "redith.seedance.history.v1";
const HISTORY_KEEP = 100;
const HISTORY_DISPLAY = 50;
const MIN_DURATION_SECONDS = 4;
const MAX_DURATION_SECONDS = 15;
const GEMINI_OMNI_DURATIONS = [4, 6, 8, 10];

const examples = {
  text: {
    prompt: "一辆汽车乘风破浪，冲向悉尼歌剧院",
    duration: 4,
    resolution: "720p",
    ratio: "",
    mode: "regular",
    images: [],
    videos: [],
    audios: [],
    generateAudio: true,
  },
  imageText: {
    prompt: "一辆汽车乘风破浪，冲向悉尼歌剧院",
    duration: 4,
    resolution: "480p",
    ratio: "",
    mode: "regular",
    images: [
      "https://nimg.ws.126.net/?url=http%3A%2F%2Fdingyue.ws.126.net%2F2026%2F0402%2F8548d314j00tcvcze002pd000u000k0g.jpg&thumbnail=660x2147483647&quality=80&type=jpg",
      "https://nimg.ws.126.net/?url=http%3A%2F%2Fdingyue.ws.126.net%2F2026%2F0402%2Fde89a202j00tcvcze001md000u000gwg.jpg&thumbnail=660x2147483647&quality=80&type=jpg",
    ],
    videos: [],
    audios: [],
    generateAudio: false,
  },
  imageVideo: {
    prompt: "变身成龙之后，飞到一片雪山和溪流的上空",
    duration: 4,
    resolution: "480p",
    ratio: "",
    mode: "regular",
    images: ["https://gips3.baidu.com/it/u=1039279337,1441343044&fm=3028&app=3028&f=JPEG&fmt=auto&q=100&size=f1024_1024"],
    videos: ["https://example.com/reference-motion.mp4"],
    audios: [],
    generateAudio: true,
  },
  imageAudio: {
    prompt: "一辆汽车乘风破浪，冲向悉尼歌剧院，并且化身为龙，祥云满天",
    duration: 4,
    resolution: "480p",
    ratio: "",
    mode: "regular",
    images: [
      "https://nimg.ws.126.net/?url=http%3A%2F%2Fdingyue.ws.126.net%2F2026%2F0402%2F8548d314j00tcvcze002pd000u000k0g.jpg&thumbnail=660x2147483647&quality=80&type=jpg",
      "https://nimg.ws.126.net/?url=http%3A%2F%2Fdingyue.ws.126.net%2F2026%2F0402%2Fde89a202j00tcvcze001md000u000gwg.jpg&thumbnail=660x2147483647&quality=80&type=jpg",
    ],
    videos: [],
    audios: ["https://cdn.pixabay.com/audio/2025/04/15/audio_981caf755e.mp3"],
    generateAudio: true,
  },
  full: {
    prompt: "一辆汽车乘风破浪，飞快开过湖面",
    duration: 4,
    resolution: "480p",
    ratio: "",
    mode: "regular",
    images: ["https://gips3.baidu.com/it/u=1039279337,1441343044&fm=3028&app=3028&f=JPEG&fmt=auto&q=100&size=f1024_1024"],
    videos: ["https://example.com/reference-motion.mp4"],
    audios: ["https://example.com/reference-audio.mp3"],
    generateAudio: true,
  },
  firstLast: {
    prompt: "A cinematic reveal from still portrait to dynamic ending frame",
    duration: 8,
    resolution: "720p",
    ratio: "16:9",
    mode: "first-last",
    images: [],
    videos: [],
    audios: [],
    firstImage: "https://example.com/first-frame.jpg",
    lastImage: "https://example.com/last-frame.jpg",
    generateAudio: false,
  },
  muapiI2v: {
    provider: "muapi-i2v",
    prompt:
      "Add a slow cinematic orbit around the scene, gentle parallax, soft environmental motion, natural light movement, and smooth film-grade motion while preserving the original subject and composition.",
    duration: 5,
    resolution: "720p",
    ratio: "16:9",
    mode: "regular",
    images: ["https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/seedance-v1.5-pro-i2v.jpg"],
    videos: [],
    audios: [],
    lastImages: [],
    generateAudio: true,
    cameraFixed: false,
  },
  muapiT2v: {
    provider: "muapi-t2v",
    prompt:
      "A colossal floating observatory drifting above a luminous ocean at night, circular platforms rotating slowly while streams of golden energy flow between them, bioluminescent waves below, cinematic orbit camera, ultra-detailed sci-fi fantasy atmosphere.",
    duration: 5,
    resolution: "720p",
    ratio: "16:9",
    mode: "regular",
    images: [],
    videos: [],
    audios: [],
    lastImages: [],
    generateAudio: true,
    cameraFixed: false,
  },
  muapiGeminiOmni: {
    provider: "muapi-gemini-omni-i2v",
    prompt:
      "The subject slowly turns to face the camera as golden-hour light sweeps across the scene, leaves rustling in the breeze, synchronized ambient sound and cinematic camera motion.",
    duration: 8,
    resolution: "1080p",
    ratio: "16:9",
    mode: "regular",
    images: ["https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/seedance-v1.5-pro-i2v.jpg"],
    videos: [],
    audios: [],
    lastImages: [],
    generateAudio: false,
    cameraFixed: false,
    audioIds: "",
    characterIds: "",
    seed: "",
  },
};

const $ = (selector) => document.querySelector(selector);

const dimensionsByResolution = {
  "720p": {
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720, height: 1280 },
    "1:1": { width: 720, height: 720 },
    "4:3": { width: 960, height: 720 },
    "3:4": { width: 720, height: 960 },
    "21:9": { width: 1680, height: 720 },
  },
  "480p": {
    "16:9": { width: 854, height: 480 },
    "9:16": { width: 480, height: 854 },
    "1:1": { width: 480, height: 480 },
    "4:3": { width: 640, height: 480 },
    "3:4": { width: 480, height: 640 },
    "21:9": { width: 1120, height: 480 },
  },
  "1080p": {
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
    "1:1": { width: 1080, height: 1080 },
    "4:3": { width: 1440, height: 1080 },
    "3:4": { width: 1080, height: 1440 },
    "21:9": { width: 2520, height: 1080 },
  },
};

const els = {
  provider: $("#provider"),
  preset: $("#preset"),
  endpointHint: $("#endpointHint"),
  form: $("#generationForm"),
  prompt: $("#prompt"),
  duration: $("#duration"),
  resolution: $("#resolution"),
  ratio: $("#ratio"),
  ratioNote: $("#ratioNote"),
  geminiOptionsBlock: $("#geminiOptionsBlock"),
  geminiAudioIds: $("#geminiAudioIds"),
  geminiCharacterIds: $("#geminiCharacterIds"),
  geminiSeed: $("#geminiSeed"),
  generateAudioField: $("#generateAudioField"),
  generateAudio: $("#generateAudio"),
  generateAudioLabel: $("#generateAudioLabel"),
  cameraFixed: $("#cameraFixed"),
  cameraFixedField: $("#cameraFixedField"),
  autoPoll: $("#autoPoll"),
  payloadPreview: $("#payloadPreview"),
  previewVideo: $("#previewVideo"),
  previewEmpty: $("#previewEmpty"),
  previewOpenLink: $("#previewOpenLink"),
  previewDownloadLink: $("#previewDownloadLink"),
  uploadedAssets: $("#uploadedAssets"),
  connectionState: $("#connectionState"),
  taskId: $("#taskId"),
  queryTask: $("#queryTask"),
  copyCurl: $("#copyCurl"),
  resetForm: $("#resetForm"),
  clearHistory: $("#clearHistory"),
  historyBody: $("#historyBody"),
  historyCount: $("#historyCount"),
  taskStatus: $("#taskStatus"),
  progressBar: $("#progressBar"),
  progressText: $("#progressText"),
  actualRatio: $("#actualRatio"),
  firstImage: $("#firstImage"),
  lastImage: $("#lastImage"),
  firstImageFile: $("#firstImageFile"),
  lastImageFile: $("#lastImageFile"),
  firstImageMeta: $("#firstImageMeta"),
  lastImageMeta: $("#lastImageMeta"),
  modeTabs: $("#modeTabs"),
  regularMode: $("#regularMode"),
  firstLastMode: $("#firstLastMode"),
  imageBlock: $("#imageBlock"),
  imageBlockLabel: $("#imageBlockLabel"),
  imageBlockEmpty: $("#imageBlockEmpty"),
  videoBlock: $("#videoBlock"),
  audioBlock: $("#audioBlock"),
  muapiLastImageBlock: $("#muapiLastImageBlock"),
};

let currentMode = "regular";
let pollTimer = null;
let uploadedAssets = [];
let taskHistory = loadHistory();

function isMuApiSeedanceI2v(provider = currentProvider()) {
  return provider === "muapi-i2v";
}

function isMuApiSeedanceT2v(provider = currentProvider()) {
  return provider === "muapi-t2v";
}

function isMuApiGeminiOmniI2v(provider = currentProvider()) {
  return provider === "muapi-gemini-omni-i2v";
}

function isMuApiProvider(provider = currentProvider()) {
  return isMuApiSeedanceI2v(provider) || isMuApiSeedanceT2v(provider) || isMuApiGeminiOmniI2v(provider);
}

function providerDurationMax(provider = currentProvider()) {
  return isMuApiGeminiOmniI2v(provider) ? Math.max(...GEMINI_OMNI_DURATIONS) : MAX_DURATION_SECONDS;
}

function updateRatioOptions(provider = currentProvider()) {
  const isGeminiOmni = isMuApiGeminiOmniI2v(provider);
  const disabledValues = isGeminiOmni ? ["", "1:1", "4:3", "3:4", "21:9"] : [];
  els.ratio.querySelectorAll("option").forEach((option) => {
    option.disabled = disabledValues.includes(option.value);
  });
  if (els.ratio.selectedOptions[0]?.disabled) {
    els.ratio.value = isGeminiOmni ? "16:9" : "";
  }
}

function updateResolutionOptions(provider = currentProvider()) {
  const isGeminiOmni = isMuApiGeminiOmniI2v(provider);
  const option480p = els.resolution.querySelector('option[value="480p"]');
  const option1080p = els.resolution.querySelector('option[value="1080p"]');
  const option4k = els.resolution.querySelector('option[value="4k"]');
  if (option480p) option480p.disabled = isGeminiOmni;
  if (option1080p) option1080p.disabled = false;
  if (option4k) option4k.disabled = !isGeminiOmni;
  if (isGeminiOmni && els.resolution.value === "480p") {
    els.resolution.value = "1080p";
  }
  if (!isGeminiOmni && els.resolution.value === "4k") {
    els.resolution.value = "720p";
  }
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function shortenPreviewValue(value) {
  if (typeof value !== "string") return value;
  if (!value.startsWith("data:") || value.length <= PREVIEW_STRING_LIMIT) return value;
  return `${value.slice(0, PREVIEW_STRING_LIMIT)}... [Data URL 已省略，约 ${formatBytes(value.length)}]`;
}

function stringifyPayloadForPreview(payload) {
  return JSON.stringify(payload, (key, value) => shortenPreviewValue(value), 2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(data) ? data.slice(0, HISTORY_KEEP) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  taskHistory = taskHistory.slice(0, HISTORY_KEEP);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(taskHistory));
}

function formatTime(isoTime) {
  if (!isoTime) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(isoTime));
}

function payloadSummary(payload) {
  return {
    ratio: payload.aspect_ratio || payload.ratio || "-",
    duration: payload.duration ? `${payload.duration}s` : "-",
    resolution: payload.resolution || "-",
  };
}

function makeHistoryRecord(taskId, payload, response = {}) {
  const summary = payloadSummary(payload);
  return {
    id: taskId || `local-${Date.now()}`,
    taskId: taskId || "-",
    requestedAt: new Date().toISOString(),
    ratio: summary.ratio,
    actualRatio: getActualRatio(response),
    duration: summary.duration,
    resolution: summary.resolution,
    status: getStatus(response),
    videoUrl: getVideoUrl(response),
    provider: payload.provider || currentProvider(),
  };
}

function upsertHistory(record) {
  const matchIndex = taskHistory.findIndex((item) => item.id === record.id || (record.taskId !== "-" && item.taskId === record.taskId));
  if (matchIndex >= 0) {
    taskHistory[matchIndex] = { ...taskHistory[matchIndex], ...record };
  } else {
    taskHistory.unshift(record);
  }
  saveHistory();
  renderHistory();
}

function updateHistoryFromResponse(taskId, data) {
  const index = taskHistory.findIndex((item) => item.taskId === taskId || item.id === taskId);
  if (index < 0) return;
  taskHistory[index] = {
    ...taskHistory[index],
    status: getStatus(data),
    actualRatio: getActualRatio(data),
    videoUrl: getVideoUrl(data) || taskHistory[index].videoUrl,
  };
  saveHistory();
  renderHistory();
}

function effectiveRatio(record) {
  return record.actualRatio && record.actualRatio !== "-" ? `${record.ratio} / 实际 ${record.actualRatio}` : record.ratio;
}

function downloadUrl(videoUrl) {
  return `/api/download?url=${encodeURIComponent(videoUrl)}`;
}

function compactVideoUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    const path = url.pathname.length > 24 ? `${url.pathname.slice(0, 24)}...` : url.pathname;
    return `${url.host}${path}`;
  } catch {
    return videoUrl.length > 36 ? `${videoUrl.slice(0, 36)}...` : videoUrl;
  }
}

function historyStatusClass(status) {
  const value = String(status || "").toLowerCase();
  if (/success|succeeded|completed|complete|done|finish|finished|完成|成功/.test(value)) return "is-ok";
  if (/fail|failed|error|cancel|canceled|cancelled|失败|错误|取消/.test(value)) return "is-error";
  if (/pending|queue|queued|running|processing|progress|generat|等待|排队|处理中|生成/.test(value)) return "is-busy";
  return "";
}

function renderHistory() {
  const rows = taskHistory.slice(0, HISTORY_DISPLAY);
  if (els.historyCount) els.historyCount.textContent = String(rows.length);
  if (!rows.length) {
    els.historyBody.innerHTML = '<div class="history-empty">暂无生成记录</div>';
    return;
  }
  els.historyBody.innerHTML = rows
    .map((record) => {
      const hasVideo = Boolean(record.videoUrl);
      const videoCell = hasVideo
        ? `<a class="history-video-link" href="${escapeHtml(record.videoUrl)}" target="_blank" rel="noreferrer">查看结果视频</a><span class="history-url-preview" title="${escapeHtml(record.videoUrl)}">${escapeHtml(compactVideoUrl(record.videoUrl))}</span>`
        : '<span class="history-url-preview">等待生成结果</span>';
      const actions = hasVideo
        ? `<a href="${escapeHtml(record.videoUrl)}" target="_blank" rel="noreferrer">打开</a><a href="${escapeHtml(downloadUrl(record.videoUrl))}">下载</a>`
        : `<button type="button" data-query-history="${escapeHtml(record.taskId)}" data-provider="${escapeHtml(record.provider || "tkhub")}">查询</button>`;
      const status = record.status || "-";
      const statusClass = historyStatusClass(status);
      return `<article class="history-record">
        <div class="history-record-head">
          <span class="history-record-time">${escapeHtml(formatTime(record.requestedAt))}</span>
          <span class="history-status ${escapeHtml(statusClass)}">${escapeHtml(status)}</span>
        </div>
        <div class="history-record-id" title="${escapeHtml(record.taskId)}">${escapeHtml(record.taskId)}</div>
        <div class="history-record-meta">
          <span>${escapeHtml(effectiveRatio(record))}</span>
          <span>${escapeHtml(record.duration)}</span>
          <span>${escapeHtml(record.resolution)}</span>
        </div>
        <div>${videoCell}</div>
        <div class="history-actions">${actions}</div>
      </article>`;
    })
    .join("");
}

function assetKindLabel(kind) {
  if (kind === "image") return "图片";
  if (kind === "video") return "视频";
  if (kind === "audio") return "音频";
  return "文件";
}

function insertPromptMention(asset) {
  const mention = `@${asset.name}`;
  const start = els.prompt.selectionStart ?? els.prompt.value.length;
  const end = els.prompt.selectionEnd ?? els.prompt.value.length;
  const before = els.prompt.value.slice(0, start);
  const after = els.prompt.value.slice(end);
  const prefix = before && !/\s$/.test(before) ? " " : "";
  const suffix = after && !/^\s/.test(after) ? " " : "";
  els.prompt.value = `${before}${prefix}${mention}${suffix}${after}`;
  const cursor = `${before}${prefix}${mention}`.length;
  els.prompt.focus();
  els.prompt.setSelectionRange(cursor, cursor);
  updatePreview();
}

function renderUploadedAssets() {
  if (!uploadedAssets.length) {
    els.uploadedAssets.innerHTML = "<em>暂无素材</em>";
    return;
  }
  els.uploadedAssets.innerHTML = "";
  uploadedAssets.forEach((asset) => {
    const chip = document.createElement("button");
    chip.className = "asset-chip";
    chip.type = "button";
    chip.title = `插入 @${asset.name}`;
    chip.innerHTML = `<span>@${asset.name}</span>`;
    chip.addEventListener("click", () => insertPromptMention(asset));
    els.uploadedAssets.appendChild(chip);
  });
}

function rememberUploadedAsset(asset) {
  uploadedAssets = [asset, ...uploadedAssets.filter((item) => item.key !== asset.key)].slice(0, 24);
  renderUploadedAssets();
}

async function uploadFileToStorage(file, listId) {
  const body = new FormData();
  body.append("file", file);
  body.append("target", listId);

  const response = await fetch("/api/upload", {
    method: "POST",
    body,
  });
  const data = await response.json().catch(() => ({ error: "上传接口响应不是 JSON。" }));
  if (!response.ok) {
    throw new Error(data.error || `上传失败 ${response.status}`);
  }
  return data;
}

function getUrls(listId) {
  return [...document.querySelectorAll(`#${listId} .source-value`)]
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function splitIdList(value = "") {
  return value
    .split(/[\n,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function imageUploadLimit(provider = currentProvider()) {
  return isMuApiGeminiOmniI2v(provider) ? 5 : 9;
}

function listLimit(listId) {
  if (listId === "imagesList") return imageUploadLimit();
  if (listId === "videosList") return 3;
  return 0;
}

function getAcceptForList(listId) {
  if (listId === "imagesList" || listId === "muapiLastImageList") return "image/*";
  if (listId === "videosList") return "video/*";
  if (listId === "audiosList") return "audio/*";
  return "";
}

function getDimensions(resolution, ratio) {
  return dimensionsByResolution[resolution]?.[ratio] || null;
}

function addUrlRow(listId, value = "") {
  const limit = listLimit(listId);
  const currentRows = document.querySelectorAll(`#${listId} .url-row`).length;
  if (limit && currentRows >= limit) {
    setState(`${listId === "imagesList" ? "参考图" : "参考视频"}最多只能添加 ${limit} 个。`, "is-error");
    return;
  }

  const template = $("#urlRowTemplate");
  const row = template.content.firstElementChild.cloneNode(true);
  const sourceInput = row.querySelector(".source-value");
  const fileInput = row.querySelector(".file-input");
  const meta = row.querySelector(".file-meta");

  sourceInput.value = value;
  fileInput.accept = getAcceptForList(listId);

  row.querySelector(".remove-row").addEventListener("click", () => {
    row.remove();
    updatePreview();
  });

  sourceInput.addEventListener("input", () => {
    row.classList.remove("has-file");
    meta.textContent = "";
    updatePreview();
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    meta.textContent = `正在上传 ${file.name}`;
    try {
      const asset = await uploadFileToStorage(file, listId);
      sourceInput.value = asset.url;
      row.classList.add("has-file");
      meta.textContent = `${asset.name} · ${formatBytes(asset.size)} · 已上传为${assetKindLabel(asset.kind)} URL`;
      rememberUploadedAsset(asset);
      updatePreview();
    } catch (error) {
      sourceInput.value = "";
      row.classList.remove("has-file");
      meta.textContent = `上传失败：${error.message}`;
      setState(error.message, "is-error");
      updatePreview();
    }
  });

  $(`#${listId}`).appendChild(row);
}

function bindFrameImageUpload(fileInput, targetInput, meta, uploadTarget) {
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) {
      meta.textContent = "请选择图片文件。";
      setState("请选择图片文件", "is-error");
      fileInput.value = "";
      return;
    }

    meta.textContent = `正在上传 ${file.name}`;
    try {
      const asset = await uploadFileToStorage(file, uploadTarget);
      targetInput.value = asset.url;
      meta.textContent = `${asset.name} · ${formatBytes(asset.size)} · 已上传为图片 URL`;
      rememberUploadedAsset(asset);
      updatePreview();
    } catch (error) {
      meta.textContent = `上传失败：${error.message}`;
      setState(error.message, "is-error");
      updatePreview();
    } finally {
      fileInput.value = "";
    }
  });
}

function setList(listId, values = []) {
  $(`#${listId}`).innerHTML = "";
  values.forEach((value) => addUrlRow(listId, value));
}

function setMode(mode) {
  currentMode = mode;
  els.regularMode.classList.toggle("hidden", mode !== "regular");
  els.firstLastMode.classList.toggle("hidden", mode !== "first-last");
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.mode === mode);
  });
  updatePreview();
}

function currentProvider() {
  return els.provider.value;
}

function setProvider(provider) {
  els.provider.value = provider;
  const isMuapiI2v = isMuApiSeedanceI2v(provider);
  const isMuapiT2v = isMuApiSeedanceT2v(provider);
  const isGeminiOmniI2v = isMuApiGeminiOmniI2v(provider);
  const isMuapi = isMuApiProvider(provider);
  updateRatioOptions(provider);
  updateResolutionOptions(provider);
  els.endpointHint.textContent = isMuapiI2v
    ? "提交到 POST /api/v1/seedance-v1.5-pro-i2v"
    : isMuapiT2v
      ? "提交到 POST /api/v1/seedance-v1.5-pro-t2v"
      : isGeminiOmniI2v
        ? "提交到 POST /api/v1/gemini-omni-image-to-video"
        : "提交到 POST /v1/video/generations";
  els.modeTabs.classList.toggle("hidden", isMuapi);
  els.firstLastMode.classList.toggle("hidden", isMuapi || currentMode !== "first-last");
  els.regularMode.classList.toggle("hidden", !isMuapi && currentMode !== "regular");
  els.videoBlock.classList.toggle("hidden", isMuapi);
  els.audioBlock.classList.toggle("hidden", isMuapi);
  els.muapiLastImageBlock.classList.toggle("hidden", !isMuapiI2v);
  els.imageBlock.classList.toggle("hidden", isMuapiT2v);
  els.cameraFixedField.classList.toggle("hidden", !isMuapi || isGeminiOmniI2v);
  els.generateAudioField.classList.toggle("hidden", isGeminiOmniI2v);
  els.geminiOptionsBlock.classList.toggle("hidden", !isGeminiOmniI2v);
  els.prompt.required = true;
  els.imageBlockLabel.textContent = isMuapiI2v || isGeminiOmniI2v ? "输入图片（必填）" : "参考图片";
  els.imageBlockEmpty.textContent = `暂无参考图，最多 ${imageUploadLimit(provider)} 张`;
  els.generateAudioLabel.textContent = isMuapi ? "生成音频 generate_audio" : "生成或保留音频 metadata.generate_audio";
  els.ratioNote.textContent = isGeminiOmniI2v
    ? "Gemini Omni 只支持 16:9、9:16。"
    : isMuapi
      ? "MuAPI Seedance 支持 16:9、9:16、1:1、3:4、4:3、21:9。"
      : "普通参考模式可能被接口忽略；首尾帧模式支持度更高。";
  els.duration.min = String(MIN_DURATION_SECONDS);
  els.duration.max = String(providerDurationMax(provider));
  const duration = Number(els.duration.value || MIN_DURATION_SECONDS);
  if (isGeminiOmniI2v && !GEMINI_OMNI_DURATIONS.includes(duration)) {
    els.duration.value = String(examples.muapiGeminiOmni.duration);
  } else if (duration < MIN_DURATION_SECONDS || duration > providerDurationMax(provider)) {
    els.duration.value = String(Math.min(Math.max(duration, MIN_DURATION_SECONDS), providerDurationMax(provider)));
  }
  updatePreview();
}

function applyExample(name) {
  const example = examples[name] || examples.text;
  setProvider(example.provider || "tkhub");
  els.prompt.value = example.prompt;
  els.duration.value = example.duration;
  els.resolution.value = example.resolution;
  els.ratio.value = example.ratio || "";
  els.generateAudio.checked = Boolean(example.generateAudio);
  els.cameraFixed.checked = Boolean(example.cameraFixed);
  els.geminiAudioIds.value = example.audioIds || "";
  els.geminiCharacterIds.value = example.characterIds || "";
  els.geminiSeed.value = example.seed || "";
  els.firstImage.value = example.firstImage || "";
  els.lastImage.value = example.lastImage || "";
  els.firstImageMeta.textContent = "";
  els.lastImageMeta.textContent = "";
  setList("imagesList", example.images);
  setList("videosList", example.videos);
  setList("audiosList", example.audios);
  setList("muapiLastImageList", example.lastImages || []);
  setMode(example.mode);
  setProvider(example.provider || "tkhub");
}

function buildPayload() {
  const provider = currentProvider();
  if (isMuApiGeminiOmniI2v(provider)) {
    const payload = {
      provider,
      model: MUAPI_GEMINI_OMNI_MODEL,
      prompt: els.prompt.value.trim(),
      image_urls: getUrls("imagesList"),
      aspect_ratio: els.ratio.value || "16:9",
      duration: Number(els.duration.value || examples.muapiGeminiOmni.duration),
      resolution: els.resolution.value,
    };
    const audioIds = splitIdList(els.geminiAudioIds.value);
    const characterIds = splitIdList(els.geminiCharacterIds.value);
    const seed = els.geminiSeed.value.trim();
    if (audioIds.length) payload.audio_ids = audioIds;
    if (characterIds.length) payload.character_ids = characterIds;
    if (seed) payload.seed = Number(seed);
    return payload;
  }

  if (isMuApiSeedanceI2v(provider) || isMuApiSeedanceT2v(provider)) {
    const isI2v = isMuApiSeedanceI2v(provider);
    const imageUrl = getUrls("imagesList")[0] || "";
    const lastImage = getUrls("muapiLastImageList")[0] || "";
    const payload = {
      provider,
      model: isI2v ? MUAPI_I2V_MODEL : MUAPI_T2V_MODEL,
      prompt: els.prompt.value.trim(),
      aspect_ratio: els.ratio.value || "16:9",
      duration: Number(els.duration.value || MIN_DURATION_SECONDS),
      resolution: els.resolution.value,
      generate_audio: els.generateAudio.checked,
      camera_fixed: els.cameraFixed.checked,
    };
    if (isI2v) {
      payload.image_url = imageUrl;
      if (lastImage) payload.last_image = lastImage;
    }
    return payload;
  }

  const payload = {
    provider,
    model: TKHUB_MODEL,
    prompt: els.prompt.value.trim(),
    duration: Number(els.duration.value || MIN_DURATION_SECONDS),
    resolution: els.resolution.value,
  };

  const metadata = {};
  if (els.ratio.value) {
    payload.aspect_ratio = els.ratio.value;
    const dimensions = getDimensions(els.resolution.value, els.ratio.value);
    if (dimensions) {
      payload.width = dimensions.width;
      payload.height = dimensions.height;
    }
  }

  if (currentMode === "first-last") {
    metadata.frame_mode = "first-last";
    metadata.first_image = els.firstImage.value.trim();
    metadata.last_image = els.lastImage.value.trim();
  } else {
    const images = getUrls("imagesList");
    const videos = getUrls("videosList");
    const audios = getUrls("audiosList");
    if (images.length) payload.images = images;
    if (videos.length) metadata.referenceVideoUrls = videos;
    if (audios.length) metadata.referenceAudioUrls = audios;
  }

  if (els.generateAudio.checked) metadata.generate_audio = true;
  if (Object.keys(metadata).length) payload.metadata = metadata;
  return payload;
}

function validatePayload(payload) {
  if (!payload.prompt) return "请先填写提示词。";
  if (payload.provider === "muapi-i2v" && !payload.image_url) return "MuAPI 图生视频需要至少提供一张输入图片。";
  if (payload.provider === "muapi-gemini-omni-i2v") {
    if (!payload.image_urls?.length) return "Gemini Omni 图生视频需要至少提供一张输入图片。";
    if (payload.image_urls.length > 5) return "Gemini Omni 最多支持 5 张参考图。";
    if (!GEMINI_OMNI_DURATIONS.includes(payload.duration)) return "Gemini Omni 秒数只能是 4、6、8、10。";
    if (!["720p", "1080p", "4k"].includes(payload.resolution)) return "Gemini Omni 清晰度只能是 720p、1080p、4k。";
    if (!["16:9", "9:16"].includes(payload.aspect_ratio)) return "Gemini Omni 画面比例只能是 16:9 或 9:16。";
    if (payload.seed !== undefined && (!Number.isInteger(payload.seed) || payload.seed < 0 || payload.seed > 2147483647)) {
      return "Gemini Omni seed 需要是 0-2147483647 之间的整数。";
    }
    return "";
  }
  if (!payload.duration || payload.duration < MIN_DURATION_SECONDS || payload.duration > MAX_DURATION_SECONDS) {
    return `时长需要在 ${MIN_DURATION_SECONDS}-${MAX_DURATION_SECONDS} 秒之间。`;
  }
  if (payload.metadata?.frame_mode === "first-last") {
    if (!payload.metadata.first_image || !payload.metadata.last_image) return "首尾帧模式需要同时填写首帧和末帧图片 URL。";
  }
  if (payload.metadata?.referenceAudioUrls?.length && !payload.images?.length) {
    return "文档提示音频不能单独输入；使用参考音频时请至少提供一张参考图片。";
  }
  return "";
}

function updatePreview() {
  const payload = buildPayload();
  els.payloadPreview.textContent = stringifyPayloadForPreview(payload);
}

function setState(text, type = "") {
  els.connectionState.textContent = text;
  els.connectionState.className = `status-pill ${type}`;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

function endpoint(path = "") {
  return path;
}

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function formatApiError(data, fallback = "") {
  const raw =
    data?.error ||
    data?.detail ||
    data?.message ||
    data?.msg ||
    data?.data?.error ||
    data?.data?.detail ||
    data?.data?.message ||
    data?.data?.msg ||
    fallback;
  if (Array.isArray(raw) || (raw && typeof raw === "object")) {
    return JSON.stringify(raw);
  }
  return String(raw || fallback);
}

function getTaskId(data) {
  return firstString(
    data?.request_id,
    data?.data?.request_id,
    data?.taskId,
    data?.data?.taskId,
    data?.task_id,
    data?.data?.task_id,
    data?.id,
    data?.data?.id,
  );
}

function looksInvalidMuApiTaskId(taskId, provider) {
  return isMuApiProvider(provider) && (taskId === "-" || /^\d+$/.test(taskId));
}

function getProgress(data) {
  const raw = data?.progress ?? data?.data?.progress ?? data?.data?.data?.progress ?? data?.output?.progress;
  if (typeof raw === "number") return Math.max(0, Math.min(100, raw));
  if (typeof raw === "string") return Math.max(0, Math.min(100, Number(raw.replace("%", "")) || 0));
  return 0;
}

function getStatus(data) {
  return data?.status || data?.output?.status || data?.data?.status || data?.data?.data?.status || "-";
}

function getVideoUrl(data) {
  return (
    data?.url ||
    data?.video ||
    data?.result_url ||
    data?.output?.video ||
    data?.data?.output?.video ||
    data?.output?.outputs?.[0] ||
    data?.data?.output?.outputs?.[0] ||
    data?.output?.urls?.get ||
    data?.data?.output?.urls?.get ||
    data?.outputs?.[0] ||
    data?.data?.result_url ||
    data?.data?.content?.video_url ||
    data?.data?.data?.content?.video_url ||
    ""
  );
}

function getActualRatio(data) {
  return data?.ratio || data?.aspect_ratio || data?.data?.ratio || data?.data?.data?.ratio || "-";
}

function renderResponse(data) {
  const status = getStatus(data);
  const progress = getProgress(data);
  const videoUrl = getVideoUrl(data);
  const actualRatio = getActualRatio(data);
  els.taskStatus.textContent = status;
  els.progressBar.style.width = `${progress}%`;
  els.progressText.textContent = progress ? `${progress}%` : "接口未返回进度";
  els.actualRatio.textContent = `实际比例：${actualRatio}`;

  if (videoUrl) {
    els.previewVideo.src = videoUrl;
    els.previewVideo.style.display = "block";
    els.previewVideo.style.width = "100%";
    els.previewVideo.style.height = "100%";
    els.previewVideo.style.objectFit = "contain";
    els.previewVideo.style.objectPosition = "center center";
    els.previewEmpty.style.display = "none";
    els.previewOpenLink.href = videoUrl;
    els.previewDownloadLink.href = downloadUrl(videoUrl);
    els.previewOpenLink.classList.remove("is-disabled");
    els.previewDownloadLink.classList.remove("is-disabled");
  } else {
    els.previewVideo.removeAttribute("src");
    els.previewVideo.style.display = "none";
    els.previewEmpty.style.display = "block";
    els.previewOpenLink.removeAttribute("href");
    els.previewDownloadLink.removeAttribute("href");
    els.previewOpenLink.classList.add("is-disabled");
    els.previewDownloadLink.classList.add("is-disabled");
  }
}

async function submitGeneration() {
  const payload = buildPayload();
  const error = validatePayload(payload);
  if (error) {
    setState(error, "is-error");
    return;
  }
  setState("正在提交", "is-busy");
  const res = await fetch(endpoint("/api/video/generations"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ message: "响应不是 JSON", status: res.status }));
  renderResponse(data);

  if (!res.ok) {
    const message = formatApiError(data);
    setState(message ? `提交失败 ${res.status}：${message}` : `提交失败 ${res.status}`, "is-error");
    return;
  }

  const taskId = getTaskId(data);
  if (taskId) els.taskId.value = taskId;
  upsertHistory(makeHistoryRecord(taskId, payload, data));
  setState(taskId ? "任务已提交" : "已提交，未识别 task_id", "is-ok");
  if (taskId && els.autoPoll.checked) startPolling(taskId, payload.provider);
}

async function queryTask(taskId = els.taskId.value.trim(), provider = currentProvider()) {
  if (!taskId) {
    setState("请填写 task_id", "is-error");
    return null;
  }
  if (looksInvalidMuApiTaskId(taskId, provider)) {
    setState("当前任务 ID 不像 MuAPI request_id，请重新提交任务，或手动填写提交接口返回的真实 request_id。", "is-error");
    return null;
  }
  setState("正在查询", "is-busy");
  const res = await fetch(endpoint(`/api/video/generations/${encodeURIComponent(taskId)}?provider=${encodeURIComponent(provider)}`), {
    method: "GET",
  });
  const data = await res.json().catch(() => ({ message: "响应不是 JSON", status: res.status }));
  renderResponse(data);
  if (res.ok) {
    const existing = taskHistory.some((item) => item.taskId === taskId || item.id === taskId);
    if (existing) {
      updateHistoryFromResponse(taskId, data);
    } else {
      const payload = buildPayload();
      payload.provider = provider;
      upsertHistory(makeHistoryRecord(taskId, payload, data));
    }
  }
  data.__ok = res.ok;
  data.__httpStatus = res.status;
  const message = formatApiError(data);
  setState(
    res.ok ? "查询完成" : message ? `查询失败 ${res.status}：${message}` : `查询失败 ${res.status}`,
    res.ok ? "is-ok" : "is-error",
  );
  return data;
}

function startPolling(taskId, provider = currentProvider()) {
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    const data = await queryTask(taskId, provider);
    if (data && data.__ok === false) {
      clearInterval(pollTimer);
      pollTimer = null;
      return;
    }
    const status = String(getStatus(data)).toUpperCase();
    if (["SUCCESS", "SUCCEEDED", "COMPLETED", "FAILED", "ERROR"].includes(status) || getVideoUrl(data)) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }, 5000);
}

function makeCurl() {
  const payload = JSON.stringify(buildPayload(), null, 2).replaceAll("'", "'\\''");
  return [
    `curl --location --request POST '${endpoint("/api/video/generations")}' \\`,
    "  --header 'Content-Type: application/json' \\",
    `  --data-raw '${payload}'`,
  ].join("\n");
}

document.addEventListener("input", updatePreview);

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    addUrlRow(button.dataset.add);
    updatePreview();
  });
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

bindFrameImageUpload(els.firstImageFile, els.firstImage, els.firstImageMeta, "firstImage");
bindFrameImageUpload(els.lastImageFile, els.lastImage, els.lastImageMeta, "lastImage");

els.preset.addEventListener("change", () => applyExample(els.preset.value));

els.provider.addEventListener("change", () => {
  setProvider(currentProvider());
  if (isMuApiSeedanceI2v() && !getUrls("imagesList").length) {
    setList("imagesList", examples.muapiI2v.images);
  }
  if (isMuApiGeminiOmniI2v()) {
    if (!getUrls("imagesList").length) setList("imagesList", examples.muapiGeminiOmni.images);
    setList("muapiLastImageList", []);
  }
  if (isMuApiSeedanceT2v()) {
    setList("imagesList", []);
    setList("muapiLastImageList", []);
  }
  updatePreview();
});

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await submitGeneration();
  } catch (error) {
    setState(error.message.includes("CORS") ? "浏览器跨域限制，请用 curl 或后端代理提交" : error.message, "is-error");
  }
});

els.queryTask.addEventListener("click", async () => {
  try {
    await queryTask();
  } catch (error) {
    setState(error.message.includes("CORS") ? "浏览器跨域限制，请用 curl 或后端代理查询" : error.message, "is-error");
  }
});

els.historyBody.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-query-history]");
  if (!button) return;
  els.taskId.value = button.dataset.queryHistory;
  try {
    await queryTask(button.dataset.queryHistory, button.dataset.provider || currentProvider());
  } catch (error) {
    setState(error.message.includes("CORS") ? "浏览器跨域限制，请用 curl 或后端代理查询" : error.message, "is-error");
  }
});

els.copyCurl.addEventListener("click", async () => {
  await navigator.clipboard.writeText(makeCurl());
  setState("curl 已复制", "is-ok");
});

els.clearHistory.addEventListener("click", () => {
  taskHistory = [];
  saveHistory();
  renderHistory();
});

els.resetForm.addEventListener("click", () => applyExample("text"));

applyExample("text");
renderUploadedAssets();
renderHistory();
