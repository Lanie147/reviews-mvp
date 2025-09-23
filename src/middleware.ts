// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/c(.*)", // short links public
  "/r(.*)", // landing pages public
  "/api/qr(.*)", // QR images public
  "/api/track(.*)", // scan tracking public
  "/api/submit", // review submissions public  <-- add this
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  // Protect everything else (e.g., /dashboard, /dashboard/new, etc.)
  const a = await auth();
  if (!a.userId) {
    return a.redirectToSignIn({ returnBackUrl: req.url });
  }
});

export const config = {
  // run on all app & api routes, excluding _next/static and files with extensions
  matcher: ["/((?!_next|.*\\..*).*)", "/(api)(.*)"],
};
