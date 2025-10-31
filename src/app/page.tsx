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
import { buildTree, getTrees, getBits, getAllPeople, getBytes } from '@/lib/data';
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
} from '@/components/ui/card';
import type { Connection } from '@/lib/types';
import { SearchDialog } from '@/components/search-dialog';
import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminUnlock } from '@/components/admin-unlock';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function Home() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Effect to check admin status when user changes
  useMemo(() => {
    if (user && process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false); // Ensure non-admins are logged out of admin view
      }
    } else {
      setIsAdmin(false);
    }
  }, [user]);
  
  const connectionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'connections') : null),
    [firestore]
  );
  const { data: connections, loading: connectionsLoading } = useCollection<Connection>(connectionsQuery);

  const loading = connectionsLoading || isUserLoading;

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
  const allBytes = useMemo(
    () => (connections ? getBytes(connections) : []),
    [connections]
  );
  const allPeople = useMemo(
    () => (connections ? getAllPeople(connections) : []),
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

  const handleAdminLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        await signOut(auth);
        alert('You are not authorized to view this page.');
      }
    } catch (error) {
      console.error("Authentication Error: ", error);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setIsAdmin(false);
  }

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
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
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
              <OrgChartWrapper loading={loading} connections={connections} treeData={treeData} currentTreeName={currentTreeName} />
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
              <TreeSelector trees={allTrees} defaultTree={currentTreeName} className="w-[200px] bg-background rounded-md shadow-md" />
            )}
        </div>
        <main className="h-full overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 h-full overflow-auto">
             <h2 className="text-2xl font-bold tracking-tight mb-4">{pageTitle}</h2>
            <OrgChartWrapper loading={loading} connections={connections} treeData={treeData} currentTreeName={currentTreeName} />
          </div>
        </main>
        <AdminUnlock onUnlock={handleAdminLogin} />
      </div>
    </div>
  );
}

const OrgChartWrapper = ({ loading, connections, treeData, currentTreeName }: { loading: boolean, connections: Connection[] | null, treeData: any[], currentTreeName: string }) => {
  return (
    <>
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
              Your database is empty. An administrator can import a CSV to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {!loading && connections && connections.length > 0 && treeData.length > 0 && (
        <OrgChart data={treeData} currentTreeName={currentTreeName} />
      )}
      {!loading && connections && connections.length > 0 && treeData.length === 0 && (
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
    </>
  )
}
