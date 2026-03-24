import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define which routes are protected
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',        // protects /dashboard and all sub-routes
  // add more if needed, e.g. '/profile', '/create-campaign'
]);

export default clerkMiddleware(async (auth, req) => {
  // If the current route matches a protected pattern → enforce sign-in
  if (isProtectedRoute(req)) {
    await auth.protect();   // ← this is the correct call now (await!)
  }

  // Optional: you can also redirect to custom sign-in
  // if (isProtectedRoute(req)) {
  //   const { redirectToSignIn } = await auth();
  //   return redirectToSignIn({ returnBackUrl: req.url });
  // }
});

export const config = {
  matcher: [
    // Run middleware on all routes except static files and Next.js internals
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};