const MAGNIFIC_BASE_URL = "https://api.magnific.com";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getVideoUrl(data) {
  return (
    data?.data?.video_url ||
    data?.data?.url ||
    data?.data?.generated?.[0]?.url ||
    data?.data?.generated?.[0] ||
    data?.video_url ||
    data?.url ||
    data?.generated?.[0]?.url ||
    data?.generated?.[0] ||
    data?.raw?.data?.video_url ||
    data?.raw?.data?.url ||
    data?.raw?.data?.generated?.[0]?.url ||
    data?.raw?.data?.generated?.[0] ||
    null
  );
}

function getStatus(data) {
  return (
    data?.data?.status ||
    data?.status ||
    data?.raw?.data?.status ||
    data?.raw?.status ||
    "UNKNOWN"
  );
}

function isFailed(status) {
  return ["FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(
    String(status || "").toUpperCase()
  );
}

function getStatusEndpoint(modelId, taskId) {
  if (modelId === "kling-2-6-motion-control") {
    return `/v1/ai/image-to-video/kling-v2-6/${taskId}`;
  }

  if (modelId === "kling-3-0-motion-control") {
    return `/v1/ai/video/kling-v3-motion-control-pro/${taskId}`;
  }

  if (modelId === "kling-3-1-motion-control") {
    return `/v1/ai/video/kling-v3-motion-control-pro/${taskId}`;
  }

  return `/v1/ai/video/kling-v3-motion-control-pro/${taskId}`;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { apiKey, taskId, modelId } = req.body || {};

    if (!apiKey) {
      return res.status(400).json({ error: "API key kosong." });
    }

    if (!taskId) {
      return res.status(400).json({ error: "Task ID kosong." });
    }

    const endpoint = getStatusEndpoint(modelId, taskId);

    const response = await fetch(`${MAGNIFIC_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "x-magnific-api-key": apiKey
      }
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { rawText: text };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.message ||
          data?.error ||
          data?.detail ||
          data?.rawText ||
          "Gagal cek status.",
        raw: data
      });
    }

    const status = getStatus(data);
    const videoUrl = getVideoUrl(data);

    return res.status(200).json({
      ok: true,
      status,
      videoUrl,
      failed: isFailed(status),
      raw: data
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Terjadi error status."
    });
  }
}
