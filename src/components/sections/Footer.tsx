"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Twitter, Mail } from "lucide-react";

export default function Footer(){
  return (
    <footer className="bg-[#050309] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        
        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          Join the Future of Social Engagement
        </h2>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Connect your wallet and start earning or promoting in minutes.
          Powered by Web3, built for creators and engagers.
        </p>

        {/* CTA Button */}
        <div className="mb-16">
          <Button
            size="lg"
            className="bg-[#caf403] text-black font-semibold hover:bg-[#b0d900] rounded-full px-8"
          >
            GET STARTED
          </Button>
        </div>

        <Separator className="mb-10 bg-white/10" />

        {/* Contact Section */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
          
          {/* Twitter */}
          <Link
            href="https://x.com/partivox_"
            target="_blank"
            className="flex items-center gap-2 text-gray-400 hover:text-[#caf403] transition"
          >
            <Twitter size={18} />
            <span>Twitter</span>
          </Link>

          {/* Email */}
          <Link
            href="mailto:partivox11@gmail.com"
            className="flex items-center gap-2 text-gray-400 hover:text-[#caf403] transition"
          >
            <Mail size={18} />
            <span>partivox11@gmail.com</span>
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} PARTIVOX. All rights reserved.
        </p>
      </div>
    </footer>
  );
}