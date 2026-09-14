import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HF_TOKEN);

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

        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            throw new Error("Could not download image.");
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        const video = await hf.imageTextToVideo({
            model: "Lightricks/LTX-Video",
            inputs: base64Image,
            parameters: {
                prompt: prompt || "Natural cinematic movement."
            }
        });

        const videoBuffer = Buffer.from(await video.arrayBuffer());

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Content-Length", videoBuffer.length);

        return res.status(200).send(videoBuffer);

    } catch (error) {

        console.error("Video generation error:", error);

        return res.status(500).json({
            error: error.message || "Video generation failed."
        });
    }
}
