'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { buildTree, getTrees, getBits } from '@/lib/data';
import { TreeSelector } from '@/components/tree-selector';
import { ConnectionForm } from '@/components/connection-form';
import { OrgChart } from '@/components/org-chart';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { Connection } from '@/lib/types';
import { CsvImporter } from '@/components/csv-importer';
import { SearchDialog } from '@/components/search-dialog';

// Initial empty state for connections
const initialConnections: Connection[] = [];

export default function Home() {
  const searchParams = useSearchParams();
  const [connections, setConnections] =
    useState<Connection[]>(initialConnections);

  const allTrees = useMemo(() => getTrees(connections), [connections]);
  const currentTreeName =
    searchParams.get('tree') || allTrees[0] || 'No Trees Found';
  const allBits = useMemo(() => getBits(connections), [connections]);

  const treeData = useMemo(
    () => buildTree(connections, currentTreeName),
    [connections, currentTreeName]
  );

  const handleAddConnection = (newConnection: Connection) => {
    setConnections((prev) => [...prev, newConnection]);
  };

  const handleDataLoaded = (data: Connection[]) => {
    setConnections(data);
  };

  const pageTitle =
    currentTreeName === 'No Trees Found'
      ? currentTreeName
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
            <TreeSelector trees={allTrees} defaultTree={currentTreeName} />
          </SidebarGroup>
          <Separator />
          <SidebarGroup>
            <CsvImporter onDataLoaded={handleDataLoaded} />
          </SidebarGroup>
          <Separator />
          <SidebarGroup>
            <ConnectionForm
              currentTree={currentTreeName}
              onAddConnection={handleAddConnection}
              allBits={allBits}
              connections={connections}
            />
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10 h-16">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
          </div>
          <SearchDialog connections={connections} />
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          {connections.length === 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>No Data Loaded</CardTitle>
                <CardDescription>
                  Upload a CSV file or add a connection to get started.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {connections.length > 0 && treeData.length > 0 && (
            <OrgChart data={treeData} />
          )}
          {connections.length > 0 && treeData.length === 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>No Data</CardTitle>
                <CardDescription>
                  No connections found for the '{currentTreeName}' tree. Try
                  selecting another tree or adding a new connection.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
