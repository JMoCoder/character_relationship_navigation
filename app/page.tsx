import { getWorks } from "@/app/lib/data";
import { HomePageClient } from "./components/HomePageClient";

export default async function Home() {
  const works = await getWorks();

  return (
    <main className="min-h-screen selection:bg-black/20 dark:selection:bg-white/20">
      <HomePageClient works={works} />
    </main>
  );
}
