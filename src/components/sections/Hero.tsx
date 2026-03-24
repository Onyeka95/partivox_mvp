import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center text-center px-4 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* Avatars stack + users count */}
        <div className="flex justify-center mb-8">
          <div className="flex -space-x-4">
            <img
              src="/images/oneavatar.jpg"   // ← your real avatar files
              alt="User 1"
              className="w-10 h-10 rounded-full border-4 border-[#0d0d0d] object-cover"
            />
            <img
              src="/images/twoavatar.jpg"
              alt="User 2"
              className="w-10 h-10 rounded-full border-4 border-[#0d0d0d] object-cover"
            />
            <img
              src="/images/threeavatar.jpg"
              alt="User 3"
              className="w-10 h-10 rounded-full border-4 border-[#0d0d0d] object-cover"
            />
            <img
              src="/images/fouravatar.jpg"
              alt="User 4"
              className="w-10 h-10 rounded-full border-4 border-[#0d0d0d] object-cover"
            />
            <img
              src="/images/sixavatar.jpg"
              alt="User 5"
              className="w-10 h-10 rounded-full border-4 border-[#0d0d0d] object-cover"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full mb-8 text-white">
          <span>100+ registered users</span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-5xl font-bold mb-6 leading-tight">
          Explore the Largest Web3 Platform for{" "}
          <span className="text-[#caf403]">Social Growth</span> and{" "}
          <span className="text-gray-400">Rewards</span>
        </h1>

        <p className="text-lg md:text-xl mb-10 text-gray-300 max-w-3xl mx-auto">
          Launch affordable tweet campaigns or earn crypto by engaging with posts you love
        </p>

        <Button
          className="bg-[#caf403] text-black font-bold text-lg px-10 py-6 rounded-full hover:bg-[#b0d900] transition shadow-lg"
          size="lg"
        >
          Connect Wallet
        </Button>
      </div>
    </section>
  );
}