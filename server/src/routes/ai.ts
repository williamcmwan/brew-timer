import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/schema.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

interface CoffeeBeanInfo {
  name: string;
  roaster: string;
  country: string;
  region: string;
  altitude: string;
  varietal: string;
  process: string;
  roastLevel: string;
  roastFor: string;
  tastingNotes: string;
  url: string;
  roastDate: string;
  weight: number;
}

// Log API usage to database
function logApiUsage(userId: number | undefined, inputTokens: number, outputTokens: number) {
  if (!userId) return;
  try {
    db.prepare(`
      INSERT INTO api_usage (user_id, input_tokens, output_tokens)
      VALUES (?, ?, ?)
    `).run(userId, inputTokens, outputTokens);
  } catch (e) {
    console.error('Failed to log API usage:', e);
  }
}

// Validation schema for AI request
const analyzeRequestSchema = z.object({
  images: z.array(z.string().max(10 * 1024 * 1024)) // Max 10MB per image base64
    .min(1, 'At least one image is required')
    .max(5, 'Maximum 5 images allowed'),
});

router.post('/analyze-coffee-bag', async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  
  try {
    // Validate input
    const result = analyzeRequestSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message || 'Invalid input';
      return res.status(400).json({ error: errorMessage });
    }
    
    const { images } = result.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Build the parts array with images
    const parts: any[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      // Handle both base64 data URLs and raw base64
      let base64Data = imageData;
      let mimeType = 'image/jpeg';
      
      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }
      
      // Validate MIME type
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) {
        return res.status(400).json({ error: 'Invalid image type' });
      }
      
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    // Compact prompt to minimize tokens
    parts.push({
      text: `Extract coffee bag info as JSON only:
{"name":"","roaster":"","country":"","region":"","altitude":"(masl)","varietal":"","process":"","roastLevel":"","roastFor":"pour-over|espresso|","tastingNotes":"","url":"","roastDate":"YYYY-MM-DD","weight":0}
Rules: Use "N/A" if unknown (except roastFor/roastDate/weight). roastDate from stickers/stamps. weight in grams (250g→250, 1kg→1000). JSON only, no markdown.`
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return res.status(500).json({ error: 'Failed to analyze images' });
    }

    const data = await response.json();
    
    // Extract token usage from response
    const inputTokens = data.usageMetadata?.promptTokenCount;
    const outputTokens = data.usageMetadata?.candidatesTokenCount;
    
    // Extract the text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse the JSON response (handle potential markdown code blocks)
    let jsonStr = textResponse.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const coffeeInfo: CoffeeBeanInfo = JSON.parse(jsonStr);
    
    // Validate roastFor value
    if (coffeeInfo.roastFor && !['pour-over', 'espresso', ''].includes(coffeeInfo.roastFor)) {
      coffeeInfo.roastFor = '';
    }

    // Log successful API usage to database
    if (inputTokens && outputTokens) {
      logApiUsage(userId, inputTokens, outputTokens);
    }

    res.json(coffeeInfo);
  } catch (error) {
    console.error('Error analyzing coffee bag:', error);
    res.status(500).json({ error: 'Failed to analyze coffee bag images' });
  }
});

export default router;
