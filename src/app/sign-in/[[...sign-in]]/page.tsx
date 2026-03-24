import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "bg-[#1a1a1a] p-8 rounded-xl border border-gray-700",
            card: "bg-transparent shadow-none",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            formButtonPrimary: "bg-[#caf403] hover:bg-[#a0d900] text-black",
            socialButtonsBlockButton: "bg-gray-800 hover:bg-gray-700 border-gray-600",
            dividerLine: "bg-gray-700",
            dividerText: "text-gray-400",
            formFieldInput: "bg-[#0d0d0d] border-gray-600 text-white",
          }
        }}
      />
    </div>
  );
}