import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
      <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">
        404
      </h1>
      <p className="text-xl text-white/50 mb-8">
        这里是一片虚空，没有发现任何存在的痕迹。
      </p>
      <Link 
        href="/"
        className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>返回全知中心</span>
      </Link>
    </div>
  );
}
