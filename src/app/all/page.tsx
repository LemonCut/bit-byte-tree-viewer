
import { Suspense } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type { Connection } from '@/lib/types';
import { getTrees, findTreeAKAs } from '@/lib/data';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TreeViewLogo } from '@/components/icons';

async function getConnectionsData() {
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
      },
    });
    return parsed.data as Omit<Connection, 'id'>[];
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading or parsing CSV file:', error);
    return [];
  }
}

async function AllTreesPageContent() {
  const connections = await getConnectionsData();
  const treeAKAs = findTreeAKAs(connections as Connection[]);
  const { allTrees, saplings, predecessorTrees } = getTrees(connections as Connection[], 4, treeAKAs, false);


  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-20 h-16 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <TreeViewLogo className="w-8 h-8" />
          <h1 className="text-xl font-bold">Bit-Byte Tree Viewer</h1>
        </Link>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Main View
          </Link>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-6">All Trees</h2>

          <Card>
            <CardHeader>
              <CardTitle>Trees</CardTitle>
              <CardDescription>
                The larger family trees in the database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allTrees.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allTrees.map((tree) => (
                     <Button key={tree} variant="secondary" asChild>
                      <Link href={`/?tree=${encodeURIComponent(tree)}`}>
                        {tree}
                      </Link>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No main trees found. Adjust the sapling threshold to see more.
                </p>
              )}
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <CardTitle>Saplings</CardTitle>
              <CardDescription>
                These are smaller, standalone trees with four or fewer members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {saplings.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {saplings.map((sapling) => (
                    <Button key={sapling} variant="secondary" asChild>
                      <Link href={`/?tree=${encodeURIComponent(sapling)}`}>
                        {sapling}
                      </Link>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No sapling trees found.
                </p>
              )}
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <CardTitle>Predecessor Trees</CardTitle>
              <CardDescription>
                These trees have branched off and will redirect to their new trees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predecessorTrees.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {predecessorTrees.map((tree) => (
                    <Button key={tree} variant="secondary" asChild>
                      <Link href={`/?tree=${encodeURIComponent(tree)}`}>
                        {tree}
                      </Link>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No predecessor trees found.
                </p>
              )}
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader>
              <CardTitle>Uncategorized</CardTitle>
              <CardDescription>
                Connections that have not been assigned to a specific tree.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/?tree=(None)">View "No tree specified"</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function AllTreesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AllTreesPageContent />
    </Suspense>
  );
}
