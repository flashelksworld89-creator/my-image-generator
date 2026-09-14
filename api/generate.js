import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { prompt, aspectRatio } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: "Please enter a prompt."
            });
        }

        const selectedSize = aspectRatio || "1024x1024";

        const [width, height] = selectedSize
            .split("x")
            .map(Number);

        if (!width || !height) {
            return res.status(400).json({
                error: "Invalid image size."
            });
        }

        const result = await fal.subscribe("fal-ai/flux/schnell", {
            input: {
                prompt: prompt,
                image_size: {
                    width: width,
                    height: height
                },
                num_images: 1,
                output_format: "png"
            }
        });

        const imageUrl = result.data.images[0].url;

        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            throw new Error("Failed to download generated image.");
        }

        const buffer = Buffer.from(
            await imageResponse.arrayBuffer()
        );

        res.setHeader("Content-Type", "image/png");

        return res.status(200).send(buffer);

    } catch (error) {
        console.error("Fal AI error:", error);

        return res.status(500).json({
            error: error.message || "Image generation failed."
        });
    }
}
