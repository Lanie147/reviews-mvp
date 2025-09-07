// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/c/:slug",
  "/r/:slug",
  "/api/qr/:slug",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const a = await auth(); // <-- await here
  if (!a.userId) {
    return a.redirectToSignIn({ returnBackUrl: req.url }); // nice helper
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
