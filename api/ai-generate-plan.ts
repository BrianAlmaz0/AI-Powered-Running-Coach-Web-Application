import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { raceType, goalTime, raceDate, runsPerWeek, activities } = req.body;

  // Compose a prompt for the AI
  const prompt = `
        You are a running coach. Based on the following athlete data and goals, generate a realistic weekly mileage goal and a brief training plan.
        Athlete's recent activities: ${JSON.stringify(activities)}
        Race: ${raceType}
        Goal time: ${goalTime}
        Race date: ${raceDate}
        Runs per week: ${runsPerWeek}
        Return a JSON object: { "weeklyGoal": number, "plan": string, "message": string }
        `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  const aiResponse = completion.choices[0].message.content;
  const { weeklyGoal, plan, message } = JSON.parse(aiResponse || "{}");

  res.status(200).json({ weeklyGoal, plan, message });
}