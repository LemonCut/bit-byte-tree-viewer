
'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TreeViewLogo } from '@/components/icons';
import { getTrees, getAllPeople, findTreeAKAs, findDisconnectedTrees, buildTree } from '@/lib/data';
import { TreeSelector } from '@/components/tree-selector';
import { OrgChart } from '@/components/org-chart';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { TreeNode, Connection } from '@/lib/types';
import { SearchDialog } from '@/components/search-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminUnlock } from '@/components/admin-unlock';
import { Button } from '@/components/ui/button';
import { LogOut, Share2 } from 'lucide-react';
import { ShuffleLayoutButton } from '@/components/shuffle-layout-button';
import React from 'react';
import { HelpDialog } from '@/components/help-dialog';
import Link from 'next/link';
import { DisconnectedTrees } from '@/components/disconnected-trees';
import { ManageConnections } from '@/components/manage-connections';
import { AddConnectionForm } from '@/components/add-connection-form';
import { ThemeToggle } from '@/components/theme-toggle';

type TreeViewerPageProps = {
  connections: Connection[];
};

function TreeViewerPageContent({ connections }: TreeViewerPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [shuffledTreeData, setShuffledTreeData] = useState<TreeNode[] | null>(null);
  
  const loading = !connections;
  
  const treeParam = searchParams.get('tree');

  const treeAKAs = useMemo(
    () => (connections ? findTreeAKAs(connections) : {}),
    [connections]
  );

  useEffect(() => {
    if (!isAdmin && treeParam && treeParam !== '(None)' && treeAKAs[treeParam]) {
      const newTreeName = treeAKAs[treeParam];
      if (treeParam !== newTreeName) {
          const params = new URLSearchParams(searchParams.toString());
          params.set('tree', newTreeName);
          router.replace(`${pathname}?${params.toString()}`);
      }
    }
  }, [isAdmin, treeParam, treeAKAs, router, pathname, searchParams]);


  const { allTrees } = useMemo(
    () => (connections ? getTrees(connections, treeAKAs, isAdmin) : { allTrees: [], saplings: [] }),
    [connections, treeAKAs, isAdmin]
  );
  
  const currentTreeName = treeParam || '';

  const allPeople = useMemo(
    () => (connections ? getAllPeople(connections) : []),
    [connections]
  );

  const disconnectedTrees = useMemo(
    () => (connections ? findDisconnectedTrees(connections) : []),
    [connections]
  );
  
  const treeData = useMemo(
    () =>
      connections && treeParam ? buildTree(connections, treeParam) : [],
    [connections, treeParam]
  );

  useEffect(() => {
    setShuffledTreeData(treeData);
  }, [treeData]);
  
  let pageTitle = 'Welcome';
  if (treeParam) {
    pageTitle = `${treeParam} Tree`;
  }

  const handleAdminToggle = () => {
    setIsAdmin(!isAdmin);
  };
  
  if (isAdmin) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between p-2">
                <Link href="/" className="flex items-center gap-2">
                    <TreeViewLogo className="w-8 h-8" />
                    <h1 className="text-xl font-bold">Bit-Byte Tree Viewer</h1>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleAdminToggle} title="Lock Admin View">
                    <LogOut />
                </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">Admin Mode</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
                <AddConnectionForm 
                    people={allPeople.map(p => p.name)} 
                    trees={allTrees.filter(t => t !== '')} 
                    currentTree={currentTreeName}
                />
            </SidebarGroup>
            <Separator />
             <SidebarGroup>
                <ManageConnections connections={connections} people={allPeople.map(p => p.name)} trees={allTrees.filter(t => t !== '')} />
            </SidebarGroup>
            <Separator />
            <SidebarGroup>
                <ShuffleLayoutButton
                    treeData={shuffledTreeData}
                    onShuffle={setShuffledTreeData}
                />
            </SidebarGroup>
            <div className="mt-auto">
              <Separator />
              <SidebarGroup>
                  <DisconnectedTrees treeNames={disconnectedTrees} />
              </SidebarGroup>
            </div>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1 min-h-0 h-screen">
          <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-20 h-16 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SearchDialog connections={connections || []} />
            </div>
          </header>
          <main className="flex-1 overflow-auto relative">
             <div className="absolute top-4 right-4 z-10">
                {loading ? (
                    <Skeleton className="h-10 w-[200px]" />
                ) : (
                    <TreeSelector trees={allTrees} defaultTree={currentTreeName} className="w-[200px] bg-background rounded-md shadow-md" />
                )}
            </div>
            <div className="p-4 md:p-6 lg:p-8 h-full">
              <div className="mb-4 h-[40px]">
                  <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
              </div>
              <OrgChartWrapper 
                loading={loading} 
                connections={connections} 
                treeData={shuffledTreeData} 
                currentTreeName={currentTreeName} 
                treeParam={treeParam}
              />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-20 h-16 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <TreeViewLogo className="w-8 h-8" />
          <h1 className="text-xl font-bold">Bit-Byte Tree Viewer</h1>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SearchDialog connections={connections || []} />
        </div>
      </header>
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
           {loading ? (
              <Skeleton className="h-10 w-[200px]" />
            ) : (
              <TreeSelector trees={allTrees} defaultTree={currentTreeName} className="w-[200px] bg-background rounded-md shadow-md" />
            )}
        </div>
        <main className="h-full overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 h-full">
             <div className="mb-4 h-[40px]">
                <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
            </div>
            <OrgChartWrapper 
                loading={loading} 
                connections={connections} 
                treeData={shuffledTreeData} 
                currentTreeName={currentTreeName} 
                treeParam={treeParam}
            />
          </div>
        </main>
        <AdminUnlock onUnlock={handleAdminToggle} />
        <HelpDialog />
      </div>
    </div>
  );
}

const OrgChartWrapper = ({ loading, connections, treeData, currentTreeName, treeParam }: { loading: boolean, connections: Connection[] | null, treeData: TreeNode[] | null, currentTreeName: string, treeParam: string | null }) => {
  if (!treeParam && !loading) {
    return (
       <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit">
                        <Share2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="mt-4">Welcome to the Bit-Byte Tree Viewer</CardTitle>
                    <CardDescription>
                        To get started, select a tree from the dropdown menu at the top right, or use the search icon to find a specific person.
                    </CardDescription>
                </CardHeader>
            </Card>
       </div>
    )
  }

  if (loading || treeData === null) {
    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Loading Data...</CardTitle>
                <CardDescription>
                Please wait while the connections are being loaded.
                </CardDescription>
            </CardHeader>
        </Card>
    );
  }
  
  if (connections && connections.length === 0) {
    return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>No Data Found</CardTitle>
            <CardDescription>
              Your `connections.csv` file is empty. An administrator can add data to get started.
            </CardDescription>
          </CardHeader>
        </Card>
    );
  }

  return (
    <div className="h-[calc(100%-56px)]">
      {treeData.length > 0 ? (
        <OrgChart 
            data={treeData} 
            currentTreeName={currentTreeName} 
        />
      ) : (
         treeParam && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>No Data in Tree</CardTitle>
                <CardDescription>
                  No connections found for the '{currentTreeName}' tree. Try
                  selecting another tree or ask an administrator to add a new connection to the CSV file.
                </CardDescription>
              </CardHeader>
            </Card>
          )
      )}
    </div>
  );
};

export function TreeViewerPage({ connections }: TreeViewerPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TreeViewerPageContent connections={connections} />
    </Suspense>
  )
}
