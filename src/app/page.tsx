'use client';

import { useMemo, useState } from 'react';
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
import { buildTree, getTrees, getBits, getAllPeople, getBytes, getUnassignedConnections } from '@/lib/data';
import { TreeSelector } from '@/components/tree-selector';
import { ConnectionForm } from '@/components/connection-form';
import { DataManagement } from '@/components/data-management';
import { RemovePersonForm } from '@/components/remove-person-form';
import { ModifyConnectionForm } from '@/components/modify-connection-form';
import { OrgChart } from '@/components/org-chart';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import type { Connection } from '@/lib/types';
import { SearchDialog } from '@/components/search-dialog';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminUnlock } from '@/components/admin-unlock';
import { Button } from '@/components/ui/button';
import { LogOut, Search, Share2, Link2, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


export default function Home() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  
  const [isAdmin, setIsAdmin] = useState(false);
  
  const connectionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'connections') : null),
    [firestore]
  );
  const { data: connections, isLoading: connectionsLoading } = useCollection<Connection>(connectionsQuery);

  const loading = connectionsLoading;
  
  const treeParam = searchParams.get('tree');

  const { allTrees, hasUnassigned } = useMemo(
    () => (connections ? getTrees(connections) : { allTrees: [], hasUnassigned: false }),
    [connections]
  );
  
  const currentTreeName = treeParam || allTrees[0] || 'No Trees Found';

  const allBits = useMemo(
    () => (connections ? getBits(connections) : []),
    [connections]
  );
  const allBytes = useMemo(
    () => (connections ? getBytes(connections) : []),
    [connections]
  );
  const allPeople = useMemo(
    () => (connections ? getAllPeople(connections) : []),
    [connections]
  );
  
  const unassignedConnections = useMemo(
    () => (connections ? getUnassignedConnections(connections) : []),
    [connections]
  )

  const treeData = useMemo(
    () =>
      connections && treeParam ? buildTree(connections, treeParam) : [],
    [connections, treeParam]
  );
  
  let pageTitle = 'Welcome';
  if (treeParam === 'Unassigned') {
    pageTitle = 'Unassigned Connections';
  } else if (treeParam) {
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
                <div className="flex items-center gap-2">
                    <TreeViewLogo className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">TreeView</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={handleAdminToggle} title="Lock Admin View">
                    <LogOut />
                </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">Admin Mode</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Select Tree</SidebarGroupLabel>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <TreeSelector trees={allTrees} defaultTree={currentTreeName} hasUnassigned={hasUnassigned} />
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
              <RemovePersonForm allBits={allBits} connections={connections || []} />
            </SidebarGroup>
             <Separator />
            <SidebarGroup>
                <ModifyConnectionForm allBits={allBits} allBytes={allBytes} allTrees={allTrees} connections={connections || []} />
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
              <OrgChartWrapper loading={loading} connections={connections} treeData={treeData} currentTreeName={currentTreeName} treeParam={treeParam} unassignedConnections={unassignedConnections} />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Regular user view
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-20 h-16 shrink-0">
        <div className="flex items-center gap-2">
          <TreeViewLogo className="w-8 h-8" />
          <h1 className="text-2xl font-bold">TreeView</h1>
        </div>
        <div className="flex items-center gap-2">
          <SearchDialog connections={connections || []} />
        </div>
      </header>
      <div className="relative flex-1">
        <div className="absolute top-4 right-4 z-10">
           {loading ? (
              <Skeleton className="h-10 w-[200px]" />
            ) : (
              <TreeSelector trees={allTrees} defaultTree={currentTreeName} hasUnassigned={hasUnassigned} className="w-[200px] bg-background rounded-md shadow-md" />
            )}
        </div>
        <main className="h-full overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 h-full overflow-auto">
             <h2 className="text-2xl font-bold tracking-tight mb-4">{pageTitle}</h2>
            <OrgChartWrapper loading={loading} connections={connections} treeData={treeData} currentTreeName={currentTreeName} treeParam={treeParam} unassignedConnections={unassignedConnections} />
          </div>
        </main>
        <AdminUnlock onUnlock={handleAdminToggle} />
      </div>
    </div>
  );
}

const OrgChartWrapper = ({ loading, connections, treeData, currentTreeName, treeParam, unassignedConnections }: { loading: boolean, connections: Connection[] | null, treeData: any[], currentTreeName: string, treeParam: string | null, unassignedConnections: Connection[] }) => {
  if (!treeParam && !loading) {
    return (
       <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit">
                        <Share2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="mt-4">Welcome to TreeView</CardTitle>
                    <CardDescription>
                        To get started, select a tree from the dropdown menu at the top right, or use the search icon to find a specific person.
                    </CardDescription>
                </CardHeader>
            </Card>
       </div>
    )
  }

  if (loading) {
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
  
  if (treeParam === 'Unassigned') {
    if (unassignedConnections.length === 0) {
       return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>No Unassigned Connections</CardTitle>
                    <CardDescription>
                    All connections currently have a tree name assigned.
                    </CardDescription>
                </CardHeader>
            </Card>
       );
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>Unassigned Connections</CardTitle>
                <CardDescription>These connections do not have a tree name assigned. An admin can edit them to assign one.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Byte</TableHead>
                        <TableHead>Bit</TableHead>
                        <TableHead className="text-right">Year</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {unassignedConnections.map((conn) => (
                            <TableRow key={conn.id}>
                                <TableCell className="font-medium">{conn.byte}</TableCell>
                                <TableCell>{conn.bit}</TableCell>
                                <TableCell className="text-right">{conn.year}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
  }

  if (connections && connections.length === 0) {
    return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>No Data Found</CardTitle>
            <CardDescription>
              Your database is empty. An administrator can import a CSV to get started.
            </CardDescription>
          </CardHeader>
        </Card>
    );
  }

  return (
    <div className="h-[calc(100%-40px)]">
      {treeData.length > 0 && (
        <OrgChart data={treeData} currentTreeName={currentTreeName} />
      )}
      {treeData.length === 0 && treeParam && treeParam !== 'Unassigned' && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>No Data in Tree</CardTitle>
            <CardDescription>
              No connections found for the '{currentTreeName}' tree. Try
              selecting another tree or ask an administrator to add a new connection.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
