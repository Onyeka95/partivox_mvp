"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Twitter, Mail, Send } from "lucide-react";
import { SignInButton, UserButton, ClerkLoaded, useUser } from "@clerk/nextjs";

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy_policy" },
  { label: "Terms", href: "/terms" },
  { label: "Documentation", href: "/documentation" },
  { label: "How It Works", href: "/how_it_works" },
];

const socialLinks = [
  {
    label: "Twitter",
    href: "https://x.com/parti_vox",
    icon: Twitter,
  },
  {
    label: "Telegram",
    href: "https://t.me/partivoxs",
    icon: Send,
  },
  {
    label: "Medium",
    href: "https://medium.com/@partivox11",
    icon: null,
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:partivox11@gmail.com",
    icon: Mail,
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#050309] border-t border-white/10">
      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-16">
          {/* Left: Heading */}
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Join the Future of{" "}
              <span className="text-[#caf403]">Social Engagement</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Connect your wallet and start earning or promoting in minutes.
              Powered by Web3, built for creators and engagers.
            </p>
          </div>

          {/* Right: CTA */}
          <div className="flex-shrink-0">
          <SignInButton mode="modal">  
            <Button
              size="lg"
              className="bg-[#caf403] text-black font-bold hover:bg-[#b0d900] rounded-full px-10 py-6 text-base tracking-wide uppercase"
            >
              Get Started
            </Button>
          </SignInButton>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-10" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Logo + Copyright */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="inline-block">
              <Image
                src="/images/PartivoxGreen.png"
                alt="Partivox"
                width={120}
                height={40}
                style={{ height: "auto" }}
                className="object-contain"
              />
            </Link>
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} PARTIVOX. All rights reserved.
            </p>
          </div>

          {/* Links + Socials */}
          <div className="flex flex-col gap-5 md:items-end">
            {/* Page Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-400 hover:text-[#caf403] text-sm transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-5">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-[#caf403] transition-colors duration-200"
                  title={social.label}
                >
                  {social.icon ? (
                    <social.icon size={18} />
                  ) : (
                    social.svg
                  )}
                  <span className="text-sm">{social.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
