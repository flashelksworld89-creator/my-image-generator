import { fal } from "@fal-ai/client";

fal.config({
    credentials: process.env.FAL_KEY
});

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { imageUrl, prompt } = req.body;

        if (!imageUrl) {
            return res.status(400).json({
                error: "Image URL is required."
            });
        }

        const result = await fal.subscribe(
            "fal-ai/kling-video/v1.6/pro/image-to-video",
            {
                input: {
                    prompt: prompt || "Natural cinematic movement.",
                    image_url: imageUrl,
                    duration: "5",
                    aspect_ratio: "16:9",
                    negative_prompt: "blur, distort, and low quality",
                    cfg_scale: 0.5
                }
            }
        );

        return res.status(200).json({
            videoUrl: result.data?.video?.url || result.video?.url
        });

    } catch (error) {

        console.error("Video generation error:", error);

        return res.status(500).json({
            error: error.message || "Video generation failed."
        });
    }
}
