'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Connection } from '@/lib/types';
import Papa from 'papaparse';
import { Upload, Download } from 'lucide-react';

type DataManagementProps = {
  connections: Connection[];
};

export function DataManagement({ connections }: DataManagementProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No file selected or database connection not found.',
      });
      return;
    }

    Papa.parse<Omit<Connection, 'id'>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newConnections = results.data;
        if (newConnections.length === 0) {
          toast({
            variant: 'destructive',
            title: 'Import Error',
            description: 'The CSV file is empty or invalid.',
          });
          return;
        }

        try {
          const batch = writeBatch(firestore);
          const connectionsCollection = collection(firestore, 'connections');
          newConnections.forEach((conn) => {
            // Ensure year is a number and required fields exist
            const year = Number(conn.year);
            if (conn.byte && conn.bit && conn.treeName && !isNaN(year)) {
               const docRef = doc(connectionsCollection); // Correctly create a new doc ref
               batch.set(docRef, { ...conn, year });
            }
          });
          await batch.commit();
          toast({
            title: 'Success!',
            description: `${newConnections.length} connections imported successfully.`,
          });
        } catch (error) {
          console.error('Error importing data: ', error);
          toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem importing the connections.',
          });
        }
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        toast({
          variant: 'destructive',
          title: 'CSV Parsing Error',
          description: error.message,
        });
      },
    });
  };

  const handleExport = () => {
    if (connections.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Export Error',
        description: 'There is no data to export.',
      });
      return;
    }
    
    // We only want to export the core fields, not Firestore-specific ones like `id`
    const exportData = connections.map(({ byte, bit, treeName, year }) => ({
        byte,
        bit,
        treeName,
        year,
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'connections.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Success!',
      description: 'Connections exported successfully.',
    });
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg">Data Management</CardTitle>
        <CardDescription>Import or export your data.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex flex-col space-y-2">
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
        <Button
          onClick={triggerFileSelect}
          disabled={!firestore}
        >
          <Upload className="mr-2 h-4 w-4" /> Import CSV
        </Button>
        <Button
          onClick={handleExport}
          variant="outline"
          disabled={connections.length === 0}
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </CardContent>
    </Card>
  );
}
