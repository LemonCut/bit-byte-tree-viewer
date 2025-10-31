import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { TreeViewLogo } from '@/components/icons';
import { buildTree, getTrees, getPeople } from '@/lib/data';
import { TreeSelector } from '@/components/tree-selector';
import { ConnectionForm } from '@/components/connection-form';
import { TreeView } from '@/components/tree-view';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home({
  searchParams,
}: {
  searchParams?: {
    tree?: string;
  };
}) {
  const allTrees = getTrees();
  const allPeople = getPeople();
  const currentTreeName = searchParams?.tree || allTrees[0] || 'No Trees Found';
  const treeData = buildTree(currentTreeName);

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
            <TreeSelector trees={allTrees} defaultTree={currentTreeName} />
          </SidebarGroup>
          <Separator />
          <SidebarGroup>
            <ConnectionForm currentTree={currentTreeName} />
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10 h-16">
          <div className="flex items-center gap-4">
             <SidebarTrigger className="md:hidden" />
             <h2 className="text-2xl font-bold tracking-tight">{currentTreeName}</h2>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          {treeData.length > 0 ? (
            <TreeView data={treeData} />
          ) : (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>No Data</CardTitle>
                <CardDescription>
                  No connections found for the '{currentTreeName}' tree. Try selecting another tree or adding a new connection.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
