import { InferenceClient } from "@huggingface/inference";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
const { prompt, aspectRatio } = req.body;
        const selectedSize = aspectRatio || "1024x1024";
        if (!prompt) {
            return res.status(400).json({ error: "Please enter a prompt." });
        }

        const client = new InferenceClient(process.env.HF_TOKEN);

       const [width, height] = selectedSize.split("x").map(Number);

const image = await client.textToImage({
    model: "black-forest-labs/FLUX.1-schnell",
    prompt: prompt,
    width: width,
    height: height
});

        const buffer = Buffer.from(await image.arrayBuffer());

        res.setHeader("Content-Type", "image/png");
        return res.status(200).send(buffer);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message || "Image generation failed."
        });
    }
}
