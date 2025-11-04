
import { Suspense } from 'react';
import { TreeViewerPage } from '@/app/tree-viewer-page';
import { PageLoader } from '@/components/page-loader';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type { Connection } from '@/lib/types';

async function getConnectionsFromCSV(): Promise<Connection[]> {
  const csvPath = path.join(process.cwd(), 'src', 'data', 'connections.csv');
  try {
    const csvFile = await fs.readFile(csvPath, 'utf-8');
    const parsed = Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      transform: (value, header) => {
        if (header === 'year') {
          return Number(value);
        }
        return value;
      }
    });

    // Add a unique ID to each connection
    return parsed.data.map((row: any, index: number) => ({
      ...row,
      id: `${row.tree}-${row.byte}-${row.bit}-${index}`,
    })) as Connection[];

  } catch (error) {
     if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.warn("connections.csv not found. An empty file will be created if you add a connection.");
      return [];
    }
    console.error("Error reading or parsing CSV file:", error);
    return [];
  }
}

export default async function Home() {
  const connections = await getConnectionsFromCSV();

  return (
    <Suspense fallback={<PageLoader />}>
      <TreeViewerPage connections={connections} />
    </Suspense>
  );
}
