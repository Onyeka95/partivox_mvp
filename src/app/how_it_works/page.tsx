import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      title: "Create an Account",
      description: "Sign up with your email. Connect your Twitter/X handle and crypto wallet in your profile to unlock full platform features.",
    },
    {
      number: "02",
      title: "Browse Campaigns",
      description: "Explore active campaigns from creators looking to grow their social presence. Each campaign shows the reward in diamonds and the required task.",
    },
    {
      number: "03",
      title: "Complete Tasks",
      description: "Follow, retweet, comment, or engage as required. Once done, submit your proof (screenshot or link) through the claim system.",
    },
    {
      number: "04",
      title: "Get Verified & Earn",
      description: "Our admin team reviews your claim. Approved claims are credited to your diamonds balance instantly.",
    },
    {
      number: "05",
      title: "Withdraw or Reinvest",
      description: "Convert your diamonds to USDT and withdraw to your wallet, or use them to fund your own campaigns and grow your own audience.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-[#caf403] text-sm hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-4">How It Works</h1>
        <p className="text-gray-400 mb-14 text-lg">
          Partivox connects social media engagers with creators in a transparent, rewarding ecosystem.
        </p>

        <div className="space-y-10">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6 group">
              <div className="flex-shrink-0">
                <span className="text-4xl font-black text-[#caf403] opacity-60 group-hover:opacity-100 transition">
                  {step.number}
                </span>
              </div>
              <div className="pt-2">
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-6 bg-[#1a1a1a] rounded-xl border border-[#caf403]/20">
          <p className="text-gray-300 text-center">
            Ready to start?{" "}
            <Link href="/" className="text-[#caf403] font-semibold hover:underline">
              Launch the app →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
