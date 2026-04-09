import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-[#caf403] text-sm hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-10 text-sm">Last updated: April 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide when registering, including your email address, wallet address, and social media handles. We also collect usage data such as campaign activity, claims, and transaction history.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>Your information is used to operate the Partivox platform, process diamond transactions, verify campaign claims, and communicate important updates to you.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal data. We may share data with third-party services necessary to operate the platform (e.g., authentication providers, blockchain networks).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Wallet & Blockchain Data</h2>
            <p>Wallet addresses and on-chain transactions are public by nature of blockchain technology. We are not responsible for the public visibility of on-chain data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contact</h2>
            <p>For privacy-related inquiries, contact us at <a href="mailto:partivox11@gmail.com" className="text-[#caf403] hover:underline">partivox11@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
