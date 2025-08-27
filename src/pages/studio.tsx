import { useState } from "react";

export default function Studio() {
  const [prompt, setPrompt] = useState("");
  const [img, setImg] = useState<string | null>(null);
  async function generate() {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, userEmail: "demo@you.com" })
    });
    const data = await res.json();
    if (data.imageBase64) setImg("data:image/png;base64," + data.imageBase64);
    else alert(data.error || "error");
  }
  return (
    <div style={{ padding: 40 }}>
      <h2>Studio</h2>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the image..." rows={5} style={{ width: 600 }} />
      <div><button onClick={generate}>Generate (10 credits)</button></div>
      {img && <div style={{ marginTop: 20 }}><img src={img} alt="result" width={512} /></div>}
    </div>
  );
}
