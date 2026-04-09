import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-[#caf403] text-sm hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-400 mb-10 text-sm">Last updated: April 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Partivox, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Eligibility</h2>
            <p>You must be at least 18 years old to use Partivox. By using this platform, you represent that you meet this requirement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Diamond System</h2>
            <p>Diamonds are in-platform credits with no guaranteed monetary value. Partivox reserves the right to modify diamond rates, conversion rates, and reward structures at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Campaign Rules</h2>
            <p>Campaign creators are responsible for the accuracy of their campaigns. Fraudulent or misleading campaigns will be rejected and may result in account suspension.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Claims & Verification</h2>
            <p>All claims are subject to admin review. Partivox reserves the right to reject any claim that cannot be verified or appears to violate platform rules.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Withdrawals</h2>
            <p>Withdrawals are processed manually and subject to review. Partivox is not liable for delays caused by blockchain network congestion or third-party wallet issues.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Prohibited Conduct</h2>
            <p>You may not use bots, scripts, or any automated means to interact with the platform. Abuse of the reward system will result in permanent account termination.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:partivox11@gmail.com" className="text-[#caf403] hover:underline">partivox11@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
