import {
  clerkMiddleware,
  createRouteMatcher,
  clerkClient,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isUserRoute = createRouteMatcher(["/dashboard_user(.*)"]);
const isAdminRoute = createRouteMatcher(["/dashboard$","/dashboard/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl.clone();

  // Require login
  if ((isUserRoute(req) || isAdminRoute(req)) && !userId) {
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Protect admin dashboard
  if (isAdminRoute(req) && userId) {
    const client = await clerkClient(); // ✅ v5 fix
    const user = await client.users.getUser(userId);
    const userEmail = user.primaryEmailAddress?.emailAddress;

    const adminEmails = [
      "onyekaiwuji@gmail.com",
      "deborahmomodu999@gmail.com",
      "partivox11@gmail.com",
    ];

    if (!userEmail || !adminEmails.includes(userEmail)) {
      url.pathname = "/dashboard_user";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard_user/:path*",
  ],
};