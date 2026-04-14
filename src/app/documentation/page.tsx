import Link from "next/link";

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-[#caf403] text-sm hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-gray-400 mb-10 text-sm">Everything you need to get started on Partivox</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Getting Started</h2>
            <p>Create an account using your email address. Once logged in, connect your crypto wallet address in your profile settings to enable withdrawals.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Diamonds</h2>
            <p>Diamonds are the native credit system on Partivox. You earn diamonds by completing campaign tasks (following, retweeting, engaging). You can also purchase diamonds directly using USDT on BSC chain.</p>
            <div className="mt-4 bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
              <p className="text-sm text-gray-400">💎 1,000 Diamonds = ~1.2 USDT (rate may vary)</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Campaigns</h2>
            <p>Campaign creators fund campaigns with diamonds. Engagers complete the required tasks (follow, retweet, comment) and submit proof via the claim system. Approved claims are credited immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Buying Diamonds</h2>
            <p>Navigate to Dashboard → Buy Diamonds. Enter the amount, send the corresponding USDT to our wallet, and submit your transaction hash. Admins verify and credit your account within 24 hours.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Withdrawals</h2>
            <p>Navigate to Dashboard → Withdraw. Enter your wallet address and the amount of diamonds to convert. Withdrawals are reviewed manually and processed within 48 hours.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Support</h2>
            <p>For technical issues or questions, reach us at <a href="mailto:partivox11@gmail.com" className="text-[#caf403] hover:underline">partivox11@gmail.com</a> or join our <a href="https://t.me/partivoxs" target="_blank" className="text-[#caf403] hover:underline">Telegram community</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
