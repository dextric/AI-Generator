import Link from "next/link";
export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>AI Studio</h1>
      <p><Link href="/studio">Open Studio</Link> • <Link href="/billing">Billing</Link></p>
    </main>
  );
}
