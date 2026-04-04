export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-6 text-red-500">Access Denied</h1>
        <p className="text-xl mb-8">
          This area is restricted to authorized admins only.
        </p>
        <p className="text-gray-400 mb-10">
          If you believe this is an error, contact the project owner.
        </p>
        <a
          href="/dashboard"
          className="bg-[#caf403] text-black px-8 py-4 rounded-full font-semibold hover:bg-[#a0d900] transition"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}