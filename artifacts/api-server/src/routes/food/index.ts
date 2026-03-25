import { Router, type IRouter } from "express";
import multer from "multer";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, foodItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListFoodItemsResponse,
  ListFoodItemsResponseItem,
  DeleteFoodItemParams,
} from "@workspace/api-zod";
import { logger } from "../../lib/logger";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/food/analyze", upload.single("image"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No image provided" });
    return;
  }

  const foodName = (req.body.foodName as string) || "Unknown food";
  const imageBase64 = req.file.buffer.toString("base64");
  const mimeType = req.file.mimetype || "image/jpeg";

  req.log.info({ foodName }, "Analyzing food image");

  const prompt = `You are a food freshness expert. Analyze this food image carefully, examining:
1. Color and discoloration patterns (browning, yellowing, darkening, mold spots)
2. Texture and surface condition (wilting, shriveling, sliminess, firmness)
3. Overall visual freshness indicators

Based on your analysis, provide a JSON response with these exact fields:
{
  "foodName": "specific name of the food (improve upon '${foodName}' if you can identify it better)",
  "freshnessScore": <integer 0-100, where 100=perfectly fresh, 0=completely spoiled>,
  "freshnessLabel": <"Fresh" | "Good" | "Fair" | "Spoiled">,
  "daysUntilExpiry": <integer, estimated days until the food will expire; negative if already past>,
  "aiAnalysis": "<2-3 sentence detailed analysis of color, texture, and visual freshness indicators observed>"
}

Guidelines for scoring:
- Fresh (85-100): Vibrant color, firm texture, no signs of degradation
- Good (60-84): Minor color changes, still good quality  
- Fair (30-59): Noticeable degradation, use soon
- Spoiled (0-29): Significant mold, rot, or deterioration

Return ONLY the JSON object, no additional text.`;

  let analysisResult: {
    foodName: string;
    freshnessScore: number;
    freshnessLabel: string;
    daysUntilExpiry: number;
    aiAnalysis: string;
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const cleaned = content.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
    analysisResult = JSON.parse(cleaned);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze food image");
    res.status(500).json({ error: "Failed to analyze image" });
    return;
  }

  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(today.getDate() + Math.max(0, analysisResult.daysUntilExpiry));
  const predictedExpiryDate = expiryDate.toISOString().split("T")[0];

  const [inserted] = await db
    .insert(foodItemsTable)
    .values({
      foodName: analysisResult.foodName || foodName,
      imageUrl: null,
      freshnessScore: Math.min(100, Math.max(0, analysisResult.freshnessScore)),
      freshnessLabel: analysisResult.freshnessLabel,
      predictedExpiryDate,
      aiAnalysis: analysisResult.aiAnalysis,
      daysUntilExpiry: analysisResult.daysUntilExpiry,
      notified: false,
    })
    .returning();

  req.log.info({ id: inserted.id, foodName: inserted.foodName }, "Food item analyzed and saved");

  res.status(201).json(
    ListFoodItemsResponseItem.parse({
      ...inserted,
      createdAt: inserted.createdAt.toISOString(),
    })
  );
});

router.get("/food/items", async (req, res): Promise<void> => {
  const items = await db
    .select()
    .from(foodItemsTable)
    .orderBy(foodItemsTable.predictedExpiryDate);

  const parsed = ListFoodItemsResponse.parse(
    items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    }))
  );

  res.json(parsed);
});

router.delete("/food/items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFoodItemParams.safeParse({ id: parseInt(raw, 10) });

  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(foodItemsTable)
    .where(eq(foodItemsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Food item not found" });
    return;
  }

  req.log.info({ id: params.data.id }, "Food item deleted");
  res.sendStatus(204);
});

export default router;
