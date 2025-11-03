
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
import type { Connection, Person } from '@/lib/types';
import { generateId } from '@/lib/data';
import Papa from 'papaparse';
import { Upload, Download } from 'lucide-react';

type DataManagementProps = {
  connections: Connection[];
  allPeople: Person[];
};

export function DataManagement({ connections, allPeople }: DataManagementProps) {
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

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const importedRows = results.data as any[];
        
        if (importedRows.length === 0) {
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
          let validConnectionsCount = 0;

          // Name to ID mapping to handle existing and new people
          const personNameToIdMap = new Map<string, string[]>();
          allPeople.forEach(p => {
              if (!personNameToIdMap.has(p.name)) {
                  personNameToIdMap.set(p.name, []);
              }
              personNameToIdMap.get(p.name)!.push(p.id);
          });
          
          // Function to get or create an ID for a person
          const getOrCreateId = (name: string): string => {
            // Simple case: name doesn't exist yet.
            if (!personNameToIdMap.has(name)) {
                const newId = generateId();
                personNameToIdMap.set(name, [newId]);
                return newId;
            }
            
            // Name exists. For this simple import, we'll assume we reuse the first ID found.
            // A more complex import might need UI to resolve duplicates.
            return personNameToIdMap.get(name)![0];
          };


          importedRows.forEach((row) => {
            // CSV might have old format or new format
            const bitName = row.bitName || row.bit;
            const byteName = row.byteName || row.byte;
            const treeName = row.treeName || row.tree;
            const year = Number(row.year);

            if (bitName && byteName && treeName && !isNaN(year)) {
               const docRef = doc(connectionsCollection);

               const bitId = row.bitId || getOrCreateId(bitName);
               const byteId = row.byteId || getOrCreateId(byteName);
               
               batch.set(docRef, { 
                   bitId,
                   bitName,
                   byteId,
                   byteName,
                   treeName,
                   year,
                });
               validConnectionsCount++;
            }
          });

          if (validConnectionsCount > 0) {
            await batch.commit();
            toast({
              title: 'Success!',
              description: `${validConnectionsCount} connections imported successfully.`,
            });
          } else {
             toast({
                variant: 'destructive',
                title: 'Import Failed',
                description: 'No valid connections found in the CSV file to import. Required headers: bitName, byteName, treeName, year.',
            });
          }

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
    
    // We export the new format with IDs
    const exportData = connections.map(({ bitId, bitName, byteId, byteName, treeName, year }) => ({
        bitId,
        bitName,
        byteId,
        byteName,
        treeName,
        year,
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'connections_export.csv');
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
        <CardDescription>
          Import/Export CSV. Headers: bitId, bitName, byteId, byteName, treeName, year.
        </CardDescription>
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
