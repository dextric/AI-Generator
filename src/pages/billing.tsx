import { useState } from "react";

export default function Billing() {
  const [loading, setLoading] = useState(false);
  async function checkout() {
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID, email: "demo@you.com" })
    });
    const data = await res.json();
    window.location.href = data.url;
  }
  return (
    <div style={{ padding: 40 }}>
      <h2>Subscribe (demo)</h2>
      <p>Monthly subscription grants 500 credits (example).</p>
      <button onClick={checkout} disabled={loading}>{loading ? "Redirecting..." : "Subscribe (Checkout)"}</button>
    </div>
  );
}
