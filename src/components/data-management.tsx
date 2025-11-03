
'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import type { Connection } from '@/lib/types';
import Papa from 'papaparse';
import { Upload, Download, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';

type DataManagementProps = {
  connections: Connection[];
};

export function DataManagement({ connections }: DataManagementProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

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

          importedRows.forEach((row) => {
            const { bit, byte, tree, year } = row;
            if (bit && byte && tree && year && !isNaN(Number(year))) {
              const docRef = doc(connectionsCollection);
              batch.set(docRef, { bit, byte, tree, year: Number(year) });
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
                description: 'No valid connections found in the CSV file to import. Required headers: bit, byte, tree, year.',
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
    
    const exportData = connections.map(({ bit, byte, tree, year }) => ({
      bit,
      byte,
      tree,
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

  const handleClearDatabase = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database connection not found.',
      });
      return;
    }

    try {
      const batch = writeBatch(firestore);
      const querySnapshot = await getDocs(collection(firestore, 'connections'));
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      toast({
        title: 'Success!',
        description: 'The entire database has been cleared.',
      });
    } catch (error) {
      console.error('Error clearing database: ', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem clearing the database.',
      });
    } finally {
      setClearDialogOpen(false);
      setConfirmText('');
    }
  };

  return (
    <>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg">Data Management</CardTitle>
          <CardDescription>
            Import/Export CSV. Required headers: bit, byte, tree, year.
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
          <Separator className="my-4" />
          <Button
            onClick={() => setClearDialogOpen(true)}
            variant="destructive"
            className="w-full"
            disabled={!firestore || connections.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear Entire Database
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible and will permanently delete all
              connections from your database. To proceed, please type{' '}
              <span className="font-bold text-foreground">Confirm</span> below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Type "Confirm" to proceed'
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearDatabase}
              disabled={confirmText !== 'Confirm'}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirm & Delete All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
