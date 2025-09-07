import { db } from "@/lib/db";
import Link from "next/link";

export default async function Dashboard() {
  const campaigns = await db.campaign.findMany({
    include: { shortLinks: true, marketplace: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Campaigns</h1>
      <div className="mt-6 space-y-6">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500">
                  {c.marketplace?.platform} {c.marketplace?.code} • /r/{c.slug}
                </div>
              </div>
              <Link className="text-blue-600 underline" href={`/r/${c.slug}`}>
                Open landing
              </Link>
            </div>
            {c.shortLinks.map((s) => (
              <div key={s.id} className="mt-4 flex items-center gap-4">
                <img src={`/api/qr/${s.slug}`} alt="qr" className="h-32 w-32" />
                <div className="text-sm">
                  <div>
                    Short: <code>/c/{s.slug}</code>
                  </div>
                  <div>
                    QR URL: <code>/api/qr/{s.slug}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
