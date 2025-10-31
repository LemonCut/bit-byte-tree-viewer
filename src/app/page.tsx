'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { TreeViewLogo } from '@/components/icons';
import { buildTree, getTrees, getBits } from '@/lib/data';
import { TreeSelector } from '@/components/tree-selector';
import { ConnectionForm } from '@/components/connection-form';
import { DataManagement } from '@/components/data-management';
import { OrgChart } from '@/components/org-chart';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { Connection } from '@/lib/types';
import { SearchDialog } from '@/components/search-dialog';
import { useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  const connectionsQuery = useMemo(
    () => (firestore ? collection(firestore, 'connections') : null),
    [firestore]
  );
  const { data: connections, loading } = useCollection<Connection>(connectionsQuery);

  const allTrees = useMemo(
    () => (connections ? getTrees(connections) : []),
    [connections]
  );
  const currentTreeName =
    searchParams.get('tree') || allTrees[0] || 'No Trees Found';
  const allBits = useMemo(
    () => (connections ? getBits(connections) : []),
    [connections]
  );

  const treeData = useMemo(
    () =>
      connections ? buildTree(connections, currentTreeName) : [],
    [connections, currentTreeName]
  );

  const pageTitle =
    currentTreeName === 'No Trees Found'
      ? 'No Data'
      : `${currentTreeName} Tree`;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <TreeViewLogo className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">TreeView</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Select Tree</SidebarGroupLabel>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <TreeSelector trees={allTrees} defaultTree={currentTreeName} />
            )}
          </SidebarGroup>
          <Separator />
          <SidebarGroup>
            <ConnectionForm
              currentTree={currentTreeName}
              allBits={allBits}
              connections={connections || []}
              allTrees={allTrees}
            />
          </SidebarGroup>
          <Separator />
           <SidebarGroup>
             <DataManagement connections={connections || []} />
           </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10 h-16 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
          </div>
          <SearchDialog connections={connections || []} />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 h-full overflow-auto">
            {loading && (
               <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Loading Data...</CardTitle>
                  <CardDescription>
                    Please wait while the connections are being loaded.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            {!loading && connections && connections.length === 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>No Data Found</CardTitle>
                  <CardDescription>
                    Your database is empty. Add a connection or import a CSV to get started.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            {!loading && connections && connections.length > 0 && treeData.length > 0 && (
              <OrgChart data={treeData} />
            )}
            {!loading && connections && connections.length > 0 && treeData.length === 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>No Data in Tree</CardTitle>
                  <CardDescription>
                    No connections found for the '{currentTreeName}' tree. Try
                    selecting another tree or adding a new connection.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
