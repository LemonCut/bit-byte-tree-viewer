
'use client';

import { useState } from 'react';
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
import { collection, writeBatch, getDocs } from 'firebase/firestore';
import type { Connection } from '@/lib/types';
import { Trash2 } from 'lucide-react';

type ClearDatabaseProps = {
  connections: Connection[];
};

export function ClearDatabase({ connections }: ClearDatabaseProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

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
      setDialogOpen(false);
      setConfirmText('');
    }
  };

  return (
    <>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg">Clear Database</CardTitle>
          <CardDescription>
            Permanently delete all data from the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Button
            onClick={() => setDialogOpen(true)}
            variant="destructive"
            className="w-full"
            disabled={!firestore || connections.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear Entire Database
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
