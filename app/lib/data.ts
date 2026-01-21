import fs from 'fs';
import path from 'path';
import { Work } from '@/app/types';

const booksDirectory = path.join(process.cwd(), 'app/data/books');

export async function getWorks(): Promise<Work[]> {
  const bookFiles = fs.readdirSync(booksDirectory).filter(file => file.endsWith('.json'));

  return bookFiles.map(file => {
    const filePath = path.join(booksDirectory, file);
    const bookData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Extract only metadata (exclude nodes and edges for the gallery)
    const { nodes, edges, ...metadata } = bookData;
    return metadata as Work;
  });
}

export async function getWorkById(id: string): Promise<Work | undefined> {
  const works = await getWorks();
  return works.find((work) => work.id === id);
}

export async function getGraphData(workId: string) {
  const filePath = path.join(booksDirectory, `${workId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const bookData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  // Return only the graph data (nodes and edges)
  return {
    nodes: bookData.nodes || [],
    edges: bookData.edges || []
  };
}
