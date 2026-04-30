const FREEPIK_BASE_URL = "https://api.freepik.com";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getTaskId(data) {
  return (
    data?.data?.task_id ||
    data?.task_id ||
    data?.result?.task_id ||
    data?.id ||
    null
  );
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
    const {
      apiKey,
      videoUrl,
      imageUrl,
      prompt,
      duration,
      aspectRatio,
      modelId
    } = req.body || {};

    if (!apiKey) {
      return res.status(400).json({ error: "API key kosong." });
    }

    if (!videoUrl) {
      return res.status(400).json({ error: "Video referensi kosong." });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "Foto model kosong." });
    }

    const finalPrompt =
      prompt ||
      `Transfer the dance motion from the reference video to the person in the image. Keep the face, identity, body shape, posture, body proportions, hairstyle, skin tone, and outfit exactly the same. Do not change the face or body at all.

Make the dance motion realistic, natural, smooth, and stable, following the timing of the reference video. The result must look like a real camera video, not AI-generated.

Negative prompt: changed face, changed identity, changed body shape, slimmer body, bigger body, face morphing, distorted hands, weird legs, stiff motion, flicker, blur, warping, AI look.`;

    const payload = {
      video_url: videoUrl,
      image_url: imageUrl,
      prompt: finalPrompt,
      duration: String(duration || 5),
      aspect_ratio: aspectRatio || "9:16",
      cfg_scale: 0.35,
      negative_prompt:
        "changed face, changed identity, changed body shape, slimmer body, bigger body, face morphing, distorted hands, weird legs, stiff motion, flicker, blur, warping, AI look"
    };

    const endpoint = getEndpoint(modelId);

    const response = await fetch(`${FREEPIK_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || data?.error || data?.detail || "Generate gagal.",
        raw: data
      });
    }

    return res.status(200).json({
      ok: true,
      taskId: getTaskId(data),
      videoUrl: getVideoUrl(data),
      raw: data
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Terjadi error backend."
    });
  }
    }
