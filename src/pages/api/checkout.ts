import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../lib/stripe";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { priceId } = req.body;
  // auth stub: replace with real auth and user lookup
  const userEmail = req.body.email || "demo@you.com";

  // create or look up Stripe customer
  let customer;
  // In prod attach user id in metadata for webhooks
  customer = await stripe.customers.create({ email: userEmail, metadata: { userEmail } });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customer.id,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: { userEmail }
  });

  // upsert user in DB
  await prisma.user.upsert({
    where: { email: userEmail },
    update: { stripeCustomerId: customer.id },
    create: { email: userEmail, stripeCustomerId: customer.id }
  });

  res.json({ url: session.url });
}
