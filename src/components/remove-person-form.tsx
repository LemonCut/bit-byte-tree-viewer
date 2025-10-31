'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { useToast } from '@/hooks/use-toast';
import type { Connection } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

const FormSchema = z.object({
  personName: z.string().min(1, "Bit's name is required."),
});

type RemovePersonFormProps = {
  allBits: string[];
  connections: Connection[];
};

export function RemovePersonForm({ allBits, connections }: RemovePersonFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [warningOpen, setWarningOpen] = useState(false);
  const [pendingData, setPendingData] = useState<z.infer<typeof FormSchema> | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      personName: '',
    },
  });

  const proceedWithSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database connection not found.',
      });
      return;
    }
    const { personName } = data;
    
    try {
        const batch = writeBatch(firestore);
        const connectionsRef = collection(firestore, 'connections');
        
        // Find connections where the person is a 'bit'
        const bitQuery = query(connectionsRef, where('bit', '==', personName));
        const bitQuerySnapshot = await getDocs(bitQuery);
        bitQuerySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Find connections where the person is a 'byte'
        const byteQuery = query(connectionsRef, where('byte', '==', personName));
        const byteQuerySnapshot = await getDocs(byteQuery);
        byteQuerySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        const totalDeletions = bitQuerySnapshot.size + byteQuerySnapshot.size;

        if (totalDeletions > 0) {
            await batch.commit();
            toast({
                title: 'Success!',
                description: `Successfully removed '${personName}' and ${totalDeletions} associated connection(s).`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Not Found',
                description: `No connections found for '${personName}'.`,
            });
        }

      form.reset();
    } catch (error) {
      console.error("Error removing documents: ", error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem removing the person.',
      });
    } finally {
      setPendingData(null);
    }
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setPendingData(data);
    setWarningOpen(true);
  }

  const handleConfirm = () => {
    if (pendingData) {
      proceedWithSubmit(pendingData);
    }
    setWarningOpen(false);
    setPendingData(null);
  };

  const handleCancel = () => {
    setWarningOpen(false);
    setPendingData(null);
  };

  return (
    <>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg">Remove Bit</CardTitle>
          <CardDescription>Remove a Bit and all their connections from all trees.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bit's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name to remove" {...field} list="bits-list" />
                    </FormControl>
                    <datalist id="bits-list">
                      {allBits.map(person => <option key={person} value={person} />)}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="destructive" className="w-full" disabled={!firestore}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove Bit
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all connections associated with '{pendingData?.personName}' from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">Confirm & Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
