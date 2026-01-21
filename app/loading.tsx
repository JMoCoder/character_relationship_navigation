export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-white/10 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
