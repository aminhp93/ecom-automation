/**
 * Fal.ai Video Generation Service (Minimax Video-01 / Kling / Luma)
 * Handles queuing, polling, and returning mp4 video URL.
 */

export interface GenerateVideoOptions {
  prompt: string;
  model?: "fal-ai/minimax/video-01" | "fal-ai/kling-video/v1.5/pro" | "fal-ai/luma-dream-machine";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  durationSeconds?: number;
}

export interface GenerateVideoResult {
  videoUrl: string;
  requestId: string;
  modelUsed: string;
}

export async function generateFalVideo(
  options: GenerateVideoOptions
): Promise<GenerateVideoResult> {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    const error = new Error(
      "Chưa tìm thấy FAL_KEY trong file .env.local. Bạn có thể đăng ký tài khoản miễn phí tại https://fal.ai (đăng nhập GitHub nhận free credit) rồi dán FAL_KEY=... vào .env.local."
    );
    (error as any).code = "MISSING_FAL_KEY";
    throw error;
  }

  const model = options.model || "fal-ai/minimax/video-01";
  const prompt = options.prompt;

  // 1. Submit to queue
  const submitRes = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      prompt_optimizer: true,
    }),
  });

  if (!submitRes.ok) {
    const errData = await submitRes.json().catch(() => ({}));
    const rawError = errData.detail || errData.message || submitRes.statusText;
    if (typeof rawError === "string" && (rawError.includes("Exhausted balance") || submitRes.status === 403)) {
      throw new Error(
        "Tài khoản Fal.ai của bạn đã hết số dư dùng thử (Exhausted balance). Bạn có thể nạp thêm một khoản nhỏ tại https://fal.ai/dashboard/billing hoặc sử dụng nút 'Copy Video Prompt + Context' để test miễn phí trên web của Kling AI / Runway."
      );
    }
    throw new Error(`Fal.ai Error (${submitRes.status}): ${rawError}`);
  }

  const queueData = await submitRes.json();
  const requestId = queueData.request_id;
  const statusUrl =
    queueData.status_url || `https://queue.fal.run/${model}/requests/${requestId}/status`;
  const responseUrl =
    queueData.response_url || `https://queue.fal.run/${model}/requests/${requestId}`;

  // 2. Poll until completed (timeout: 120s, interval: 3s)
  const maxAttempts = 40;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${apiKey}` },
    });

    if (!statusRes.ok) continue;

    const statusData = await statusRes.json();
    if (statusData.status === "COMPLETED") {
      // 3. Fetch final video url
      const finalRes = await fetch(responseUrl, {
        headers: { Authorization: `Key ${apiKey}` },
      });
      const finalData = await finalRes.json();
      const videoUrl =
        finalData.video?.url || finalData.video_url || finalData.output?.url;

      if (!videoUrl) {
        throw new Error("Không tìm thấy đường dẫn video trong phản hồi của Fal.ai.");
      }

      return {
        videoUrl,
        requestId,
        modelUsed: model,
      };
    }

    if (statusData.status === "FAILED") {
      throw new Error(`Fal.ai video generation failed: ${statusData.error || "Unknown error"}`);
    }
  }

  throw new Error("Quá thời gian chờ render video (120s). Vui lòng thử lại sau.");
}
