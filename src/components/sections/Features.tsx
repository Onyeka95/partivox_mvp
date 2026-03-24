export default function Features() {
  return (
    <section id="features" className="py-20 px-4 bg-black/30">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full mb-8">
          <img src="/logo.png" alt="Diamond" className="w-6 h-6" />
          <span className="text-lg font-medium">What we offer</span>
        </div>

        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Dynamic Features That Drive Real Results
        </h2>
        <p className="text-xl text-gray-400 mb-16">
          Empowering Creators & Engagers with Web3
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#caf403] text-black p-8 rounded-3xl h-80">
            <h3 className="text-2xl font-bold mb-4">Smart Tools</h3>
            <p>Launch campaigns, engage with posts, and earn real rewards.</p>
          </div>
          <div className="bg-purple-600 p-8 rounded-3xl h-80">
            <h3 className="text-2xl font-bold mb-4">Your Web3 Growth Toolkit</h3>
            <p>Everything you need to promote tweets or earn tokens through simple tasks.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl h-80">
            <h3 className="text-2xl font-bold mb-4">Promote. Engage. Earn.</h3>
            <p>Make it easy to grow your reach or earn crypto by interacting with real content.</p>
          </div>
        </div>
      </div>
    </section>
  );
}