// src/app/api/submit/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Re-use the same handler as /api/reviews
export { POST } from "../reviews/route";
