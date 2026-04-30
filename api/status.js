const FREEPIK_BASE_URL = "https://api.freepik.com";

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
    null
  );
}

function isFailed(status) {
  return ["FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(
    String(status || "").toUpperCase()
  );
}

function getEndpoint(modelId) {
  if (modelId === "kling-2-6-motion-control") {
    return "/v1/ai/video/kling-v2-6-motion-control-pro";
  }

  return "/v1/ai/video/kling-v3-motion-control-pro";
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

    const endpoint = getEndpoint(modelId);

    const response = await fetch(`${FREEPIK_BASE_URL}${endpoint}/${taskId}`, {
      method: "GET",
      headers: {
        "x-freepik-api-key": apiKey
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || data?.error || data?.detail || "Gagal cek status.",
        raw: data
      });
    }

    const status = data?.data?.status || data?.status || "UNKNOWN";
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
