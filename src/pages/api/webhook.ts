import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../lib/stripe";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const raw = await buffer(req);
  if (!sig) return res.status(400).send("No signature");
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook error", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // handle subscription payment succeeded events (grant credits)
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any;
    // our customer metadata: userEmail (set when creating customer in checkout)
    const customerId = invoice.customer;
    try {
      const customer = await stripe.customers.retrieve(customerId);
      const userEmail = (customer as any).metadata?.userEmail || (invoice?.metadata?.userEmail);
      if (userEmail) {
        const user = await prisma.user.findUnique({ where: { email: userEmail } });
        if (user) {
          // Grant credits (example: +500)
          const delta = 500;
          await prisma.user.update({
            where: { id: user.id },
            data: { credits: { increment: delta } }
          });
          await prisma.creditLedger.create({
            data: { userId: user.id, delta, reason: "monthly_subscription" }
          });
          console.log(`Granted ${delta} credits to ${userEmail}`);
        }
      }
    } catch (e) {
      console.error("Grant credits error", e);
    }
  }

  // Also handle checkout.session.completed for first-time grants if you prefer

  res.status(200).json({ received: true });
}
