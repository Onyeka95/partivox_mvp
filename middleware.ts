import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Protect ALL dashboard routes (requires login)
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

// Extra strict check for admin sub-routes
const isAdminRoute = createRouteMatcher([
  '/dashboard/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();

  if (isProtectedRoute(req)) {
    if (!authObject.userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    if (isAdminRoute(req)) {
      const userId = authObject.userId;

      // Hardcode your allowed admin USER IDs (from Clerk)
      const allowedAdminUserIds = [
        'user_3Arrf7r89SMxXKFp8GgVAZqB9XY',  // ← your main one from log
        'user_3ArqhZIv4CEH1lW3GIGxm5ng1TO', // add the other two
        // 'user_yyyyyy',
      ];

      // Debug log – check server terminal
      console.log('Admin check:', {
        currentUserId: userId,
        allowedIds: allowedAdminUserIds,
        isAllowed: allowedAdminUserIds.includes(userId || ''),
        path: req.nextUrl.pathname,
      });

      if (!userId || !allowedAdminUserIds.includes(userId)) {
        return NextResponse.redirect(new URL('/dashboard/access-denied', req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico|sign-in|sign-up).*)',
  ],
};