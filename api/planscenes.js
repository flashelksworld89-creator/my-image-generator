import { InferenceClient } from "@huggingface/inference";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { paragraph } = req.body;

        if (!paragraph || !paragraph.trim()) {
            return res.status(400).json({
                error: "Please enter a paragraph."
            });
        }

        const client = new InferenceClient(process.env.HF_TOKEN);

        const response = await client.chatCompletion({
            model: "Qwen/Qwen3-32B",
            provider: "auto",
            messages: [
                {
                    role: "system",
                    content: `
You are a professional visual story planner.

Turn the user's paragraph into a sequence of visual scenes.

Return ONLY valid JSON in this exact structure:

{
  "title": "short title",
  "style": "overall visual style",
  "scenes": [
    {
      "scene": 1,
      "description": "what happens",
      "visual_prompt": "detailed image-generation prompt",
      "duration": 5
    }
  ]
}

Rules:

- Create 3 to 12 scenes.
- Follow the story in chronological order.
- Each scene must represent a meaningful visual moment.
- Keep characters visually consistent.
- Keep clothing, locations, objects, and visual style consistent.
- Make each visual_prompt detailed enough for an image generator.
- Include camera angle, lighting, environment, mood, and important visual details.
- Do not invent major events that are not supported by the paragraph.
- If the paragraph is abstract, translate its ideas into meaningful visual imagery.
- Use 5 seconds as the default duration.
- Return JSON only.
`
                },
                {
                    role: "user",
                    content: paragraph.trim()
                }
            ],
            max_tokens: 4000,
            temperature: 0.7
        });

        const text = response.choices?.[0]?.message?.content;

        if (!text) {
            throw new Error("The AI did not return a scene plan.");
        }

        let cleaned = text.trim();

        if (cleaned.startsWith("```")) {
            cleaned = cleaned
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();
        }

        const scenePlan = JSON.parse(cleaned);

        if (!scenePlan.scenes || !Array.isArray(scenePlan.scenes)) {
            throw new Error("Invalid scene plan returned by AI.");
        }

        return res.status(200).json(scenePlan);

    } catch (error) {
        console.error("Scene planning error:", error);

        return res.status(500).json({
            error: error.message || "Scene planning failed."
        });
    }
}
