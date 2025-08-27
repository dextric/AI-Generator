import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { openai } from "../../lib/openai";
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt, userEmail } = req.body; // in prod, get user from session
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user || user.credits < 10) return res.status(402).json({ error: "Not enough credits" });

  // charge credits atomically in DB
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: 10 } } }),
    prisma.creditLedger.create({ data: { userId: user.id, delta: -10, reason: "image_generate" } })
  ]);

  // call OpenAI images.generate (example)
  try {
    const resp = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      response_format: "b64_json"
    });
    const b64 = resp.data?.[0]?.b64_json;
    // create job record
    const job = await prisma.job.create({
      data: { userId: user.id, type: "image_generate", prompt, cost: 10, status: "completed", resultUrl: "" }
    });
    res.json({ imageBase64: b64, creditsLeft: user.credits - 10 });
  } catch (e: any) {
    // refund on failure
    await prisma.user.update({ where: { id: user.id }, data: { credits: { increment: 10 } } });
    await prisma.creditLedger.create({ data: { userId: user.id, delta: 10, reason: "refund_on_error" } });
    console.error(e);
    res.status(500).json({ error: e.message || "OpenAI error" });
  }
}
