import { getWorkById, getGraphData, getWorks } from "@/app/lib/data";
import { GraphClient } from "./GraphClient";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const works = await getWorks();
  return works.map((work) => ({
    id: work.id,
  }));
}

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
