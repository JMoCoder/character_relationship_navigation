import { getWorkById, getGraphData } from "@/app/lib/data";
import { GraphClient } from "./GraphClient";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkPage({ params }: PageProps) {
  const { id } = await params;
  const work = await getWorkById(id);
  const graphData = await getGraphData(id);

  if (!work || !graphData) {
    notFound();
  }

  return (
    <main>
      <GraphClient 
        work={work} 
        initialNodes={graphData.nodes} 
        initialEdges={graphData.edges} 
      />
    </main>
  );
}
