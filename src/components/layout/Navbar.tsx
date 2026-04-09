"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import { SignInButton, UserButton, ClerkLoaded, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  // const { isSignedIn } = useUser();
  const { isSignedIn, user } = useUser();

  const adminEmails = [
  "onyekaiwuji@gmail.com",
  "deborahmomodu999@gmail.com",
  "partivox11@gmail.com",
];

const userEmail = user?.primaryEmailAddress?.emailAddress;

const dashboardLink =
  isSignedIn && userEmail && adminEmails.includes(userEmail)
    ? "/dashboard"
    : "/dashboard_user";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent px-4 md:px-8 py-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 text-white font-semibold text-xl">
          <Image
            src="/images/PartivoxGreen.png"
            alt="PARTIVOX Logo"
            width={150}
            height={70}
            className="object-contain"
          />
        </a>

        {/* Mobile toggler */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Menu */}
        <div
          className={`
            ${isOpen ? 'flex' : 'hidden'}
            md:flex
            flex-col md:flex-row
            items-start md:items-center
            gap-6 md:gap-8
            absolute md:static
            top-full left-0 right-0
            bg-[#0d0d0d]/95 md:bg-transparent
            backdrop-blur-md md:backdrop-blur-none
            p-6 md:p-0
            shadow-2xl md:shadow-none
            transition-all duration-300
          `}
        >
          {/* Links */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 text-left md:text-center w-full md:w-auto">
            <a
              href="#"
              className="hover:text-[#caf403] transition py-3 md:py-0"
              onClick={() => setIsOpen(false)}
            >
              Home
            </a>
            <a
              href="#features"
              className="hover:text-[#caf403] transition py-3 md:py-0"
              onClick={() => setIsOpen(false)}
            >
              Features
            </a>
            <a
              href="/how_it_works"
              className="hover:text-[#caf403] transition py-3 md:py-0"
              onClick={() => setIsOpen(false)}
            >
              How it works
            </a>

            {/* Added: Dashboard link (visible to everyone) */}
            {/* <Link
              href="/dashboard"
              className="hover:text-[#caf403] transition py-3 md:py-0 font-medium"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link> */}
            <Link
              href={dashboardLink}
              className="hover:text-[#caf403] transition py-3 md:py-0 font-medium"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>

            
          </div>

          {/* Auth area */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 mt-4 md:mt-0 w-full md:w-auto">
            <div className="relative">
              <Button variant="ghost" className="text-white px-0 hover:text-[#caf403]">
                English ▼
              </Button>
            </div>

            <ClerkLoaded>
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userPreviewMainIdentifier: "text-white",
                      userPreviewSecondaryIdentifier: "text-gray-400",
                    },
                  }}
                />
              ) : (
                <SignInButton mode="modal">
                  <Button
                    className="bg-[#caf403] text-black hover:bg-[#a0d900] rounded-full px-8 py-3 text-lg font-semibold shadow-md cursor-pointer w-full md:w-auto"
                  >
                    Launch App
                  </Button>
                </SignInButton>
              )}
            </ClerkLoaded>
          </div>
        </div>
      </div>
    </nav>
  );
}