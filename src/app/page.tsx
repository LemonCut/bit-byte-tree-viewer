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
import { useCollection, useUser, useAuth } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ** IMPORTANT: Replace with the actual administrator's email address **
const ADMIN_EMAIL = 'admin@example.com';


const SignInButton = () => {
    const auth = useAuth();

    const handleSignIn = async () => {
        if (auth) {
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error("Error signing in with Google: ", error);
            }
        }
    };

    return <Button onClick={handleSignIn}>Sign in with Google</Button>;
};

const AdminSignInPrompt = ({ user }: { user: User | null }) => {
    const [dialogOpen, setDialogOpen] = useState(true);

    if (user && user.email === ADMIN_EMAIL) {
        return null;
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Admin Access Required</DialogTitle>
                    <DialogDescription>
                        This application requires administrator access. Please sign in with the designated admin account.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <SignInButton />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function Home() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user: authUser, loading: authLoading } = useUser();

  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const connectionsQuery = useMemo(
    () => (firestore ? collection(firestore, 'connections') : null),
    [firestore]
  );
  const { data: connections, loading: connectionsLoading } = useCollection<Connection>(connectionsQuery);

  const loading = authLoading || connectionsLoading;

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

  if (isAdmin) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <TreeViewLogo className="w-8 h-8" />
              <h1 className="text-2xl font-bold">TreeView</h1>
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

  // Regular user view or loading state
  return (
    <div className="flex flex-col h-screen">
       {!authLoading && !authUser && <AdminSignInPrompt user={authUser} />}
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
