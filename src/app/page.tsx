import Link from "next/link";
export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-10">
      <h1 className="text-3xl font-bold">Reviews MVP</h1>
      <p className="mt-3 text-gray-600">
        QR → short link → Amazon review page, with scan logs.
      </p>
      <Link
        className="mt-6 inline-block rounded-lg bg-black px-4 py-2 text-white"
        href="/dashboard"
      >
        Open dashboard
      </Link>
    </main>
  );
}
