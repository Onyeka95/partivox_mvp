export default function HowItWorks() {
  return (
    <section id="works" className="py-20 px-4 bg-white text-black">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full mb-6">
            <img src="/logo.png" alt="Diamond" className="w-6 h-6" />
            <span>How it works</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Whether You Create or Engage <span className="text-gray-500">We Reward</span> Every Action
          </h2>
          <p className="text-xl text-gray-600">
            Here’s how to gain visibility and earn USDT from simple tasks
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 mt-16">
          <div className="bg-white p-8 rounded-2xl border border-gray-200">
            <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
              01
            </div>
            <h3 className="text-2xl font-bold mb-4">Connect Wallet & Twitter</h3>
            <p className="text-gray-600">Securely link your accounts using Web3 and Twitter OAuth.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 md:mt-10">
            <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
              02
            </div>
            <h3 className="text-2xl font-bold mb-4">Engage and Promote Tweets</h3>
            <p className="text-gray-600">Promote tweets and complete engagement tasks.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200">
            <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
              03
            </div>
            <h3 className="text-2xl font-bold mb-4">Earn and Swap Diamonds</h3>
            <p className="text-gray-600">Swap and use diamonds earned from tasks or convert to USDT.</p>
          </div>
        </div>
      </div>
    </section>
  );
}