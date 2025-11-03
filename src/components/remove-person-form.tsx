
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo } from 'react';

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
import type { Connection, Person } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

const FormSchema = z.object({
  personName: z.string().min(1, "Person's name is required."),
});

type RemovePersonFormProps = {
  connections: Connection[];
  allPeople: Person[];
};

export function RemovePersonForm({
  connections,
  allPeople,
}: RemovePersonFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [warningOpen, setWarningOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { personName: '' },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const personExists = allPeople.some(
      (p) => p.name.toLowerCase() === data.personName.toLowerCase()
    );
    if (!personExists) {
      toast({
        variant: 'destructive',
        title: 'Not Found',
        description: `No person named '${data.personName}' found.`,
      });
      return;
    }
    setPersonToDelete(data.personName);
    setWarningOpen(true);
  }

  const handleConfirmDelete = async () => {
    if (!firestore || !personToDelete) return;

    try {
      const batch = writeBatch(firestore);

      // Find connections where the person is a 'bit'
      const bitQuery = query(
        collection(firestore, 'connections'),
        where('bit', '==', personToDelete)
      );
      const bitQuerySnapshot = await getDocs(bitQuery);
      bitQuerySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Find connections where the person is a 'byte'
      const byteQuery = query(
        collection(firestore, 'connections'),
        where('byte', '==', personToDelete)
      );
      const byteQuerySnapshot = await getDocs(byteQuery);
      byteQuerySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();

      toast({
        title: 'Success!',
        description: `Successfully removed '${personToDelete}' and all associated connections.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error removing documents: ", error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem removing the person.',
      });
    } finally {
        setWarningOpen(false);
        setPersonToDelete(null);
    }
  };

  const allPeopleNames = useMemo(() => allPeople.map(p => p.name), [allPeople]);

  return (
    <>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg">Remove Person</CardTitle>
          <CardDescription>
            Permanently remove a person and all their connections.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person to Remove</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name to remove" {...field} list="all-people-list-remove" />
                    </FormControl>
                    <datalist id="all-people-list-remove">
                      {allPeopleNames.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="destructive" className="w-full" disabled={!firestore}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove Person
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
              This will permanently delete '{personToDelete}' and all their
              connections from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPersonToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirm & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
