
'use client';

import React, { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, forwardRef, useImperativeHandle } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Connection, Person } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { Pencil, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';

const SearchSchema = z.object({
  personName: z.string().min(1, "Person's name is required."),
});

const ModifySchema = z.object({
  originalName: z.string(),
  newName: z.string().min(1, "Person's name cannot be empty."),
  connections: z.array(z.object({
    id: z.string(),
    bit: z.string(),
    byte: z.string(),
    tree: z.string().min(1, 'Tree name is required.'),
    year: z.coerce
      .number()
      .min(1900, 'Please enter a valid year.')
      .max(new Date().getFullYear() + 1, 'Year cannot be in the distant future.'),
  })),
});

type ModifyConnectionFormProps = {
  connections: Connection[];
  allPeople: Person[];
};

export type ModifyConnectionFormHandle = {
  searchAndOpen: (personName: string) => void;
};

export const ModifyConnectionForm = forwardRef<ModifyConnectionFormHandle, ModifyConnectionFormProps>(
  ({ connections, allPeople }, ref) => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
    const [removeWarningOpen, setRemoveWarningOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

    const searchForm = useForm<z.infer<typeof SearchSchema>>({
      resolver: zodResolver(SearchSchema),
      defaultValues: { personName: '' },
    });

    const modifyForm = useForm<z.infer<typeof ModifySchema>>({
      resolver: zodResolver(ModifySchema),
    });

    const { fields, replace } = useFieldArray({
      control: modifyForm.control,
      name: 'connections',
    });

    const onSearch = (data: z.infer<typeof SearchSchema>) => {
      searchAndOpen(data.personName);
    };

    const searchAndOpen = (personName: string) => {
      const person = allPeople.find(
        (p) => p.name.toLowerCase() === personName.toLowerCase()
      );

      if (!person) {
        toast({
          variant: 'destructive',
          title: 'Not Found',
          description: `No person named '${personName}' found.`,
        });
        return;
      }

      const relatedConnections = connections.filter(
        (c) => c.bit === person.name || c.byte === person.name
      );

      setSelectedPerson(person);
      modifyForm.reset({
        originalName: person.name,
        newName: person.name,
      });
      replace(relatedConnections);
      setModifyDialogOpen(true);
    };
    
    useImperativeHandle(ref, () => ({
        searchAndOpen,
    }));

    async function onModify(data: z.infer<typeof ModifySchema>) {
      if (!firestore || !selectedPerson) return;

      const { originalName, newName, connections: modifiedConnections } = data;

      try {
        const batch = writeBatch(firestore);

        if (originalName !== newName) {
          // Update name where the person is a 'bit'
          const bitQuery = query(collection(firestore, 'connections'), where('bit', '==', originalName));
          const bitQuerySnapshot = await getDocs(bitQuery);
          bitQuerySnapshot.forEach((doc) => {
            batch.update(doc.ref, { bit: newName });
          });

          // Update name where the person is a 'byte'
          const byteQuery = query(collection(firestore, 'connections'), where('byte', '==', originalName));
          const byteQuerySnapshot = await getDocs(byteQuery);
          byteQuerySnapshot.forEach((doc) => {
            batch.update(doc.ref, { byte: newName });
          });
        }

        // Update individual connections from the form
        modifiedConnections.forEach(conn => {
          const docRef = doc(firestore, 'connections', conn.id);
          const originalConnection = connections.find(c => c.id === conn.id);

          if (originalConnection) {
            const updatedData: Partial<Connection> = {};
            if (originalConnection.tree !== conn.tree) updatedData.tree = conn.tree;
            if (originalConnection.year !== conn.year) updatedData.year = conn.year;

            // Re-check names in case they were changed
            const finalBit = conn.bit === originalName ? newName : conn.bit;
            const finalByte = conn.byte === originalName ? newName : conn.byte;
            if (originalConnection.bit !== finalBit) updatedData.bit = finalBit;
            if (originalConnection.byte !== finalByte) updatedData.byte = finalByte;

            if (Object.keys(updatedData).length > 0) {
              batch.update(docRef, updatedData);
            }
          }
        });

        await batch.commit();

        toast({
          title: 'Success!',
          description: `Details for '${originalName}' have been updated.`,
        });
        setModifyDialogOpen(false);
        searchForm.reset();

      } catch (error) {
        console.error('Error updating documents: ', error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'There was a problem updating the connections.',
        });
      }
    }

    const handleConfirmDelete = async () => {
      if (!firestore || !selectedPerson) return;
      const personToDelete = selectedPerson.name;

      try {
        const batch = writeBatch(firestore);

        const bitQuery = query(collection(firestore, 'connections'), where('bit', '==', personToDelete));
        const bitQuerySnapshot = await getDocs(bitQuery);
        bitQuerySnapshot.forEach((doc) => batch.delete(doc.ref));

        const byteQuery = query(collection(firestore, 'connections'), where('byte', '==', personToDelete));
        const byteQuerySnapshot = await getDocs(byteQuery);
        byteQuerySnapshot.forEach((doc) => batch.delete(doc.ref));

        await batch.commit();

        toast({
          title: 'Success!',
          description: `Successfully removed '${personToDelete}' and all associated connections.`,
        });
        setModifyDialogOpen(false);
        searchForm.reset();
      } catch (error) {
        console.error("Error removing documents: ", error);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem removing the person.',
        });
      } finally {
        setRemoveWarningOpen(false);
        setSelectedPerson(null);
      }
    };

    const allPeopleNames = useMemo(() => allPeople.map(p => p.name), [allPeople]);
    const allTrees = useMemo(() => Array.from(new Set(connections.map(c => c.tree || ''))).filter(Boolean), [connections]);

    return (
      <>
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg">Modify / Remove</CardTitle>
            <CardDescription>
              Find a person to edit their name, connections, or remove them.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
                <FormField
                  control={searchForm.control}
                  name="personName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name to find" {...field} list="all-people-list" />
                      </FormControl>
                      <datalist id="all-people-list">
                        {allPeopleNames.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={!firestore}>
                  <Pencil className="mr-2 h-4 w-4" /> Find & Modify
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
          <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Modify Details for {selectedPerson?.name}</DialogTitle>
              <DialogDescription>
                Edit name and connection details. Name changes will apply to all records.
              </DialogDescription>
            </DialogHeader>
            <Form {...modifyForm}>
              <form onSubmit={modifyForm.handleSubmit(onModify)} className="space-y-4 pt-4">
                <FormField
                  control={modifyForm.control}
                  name="newName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person's New Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator />
                <h4 className="text-sm font-medium">Connections</h4>
                <ScrollArea className="max-h-[40vh]">
                  <div className="p-1 space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="space-y-4 p-4 rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground">
                          {field.bit === selectedPerson?.name
                            ? `Bit to ${field.byte}`
                            : `Byte for ${field.bit}`
                          } in <span className="text-foreground font-semibold">{field.tree}</span>
                        </p>
                        <FormField
                          control={modifyForm.control}
                          name={`connections.${index}.tree`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tree Name</FormLabel>
                              <FormControl>
                                <Input {...field} list="all-trees-list" />
                              </FormControl>
                              <datalist id="all-trees-list">
                                {allTrees.map((tree) => (
                                  <option key={tree} value={tree} />
                                ))}
                              </datalist>
                              <FormMessage />
                            </FormItem>
                          )} />
                        <FormField
                          control={modifyForm.control}
                          name={`connections.${index}.year`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year of Pickup</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button type="submit" className="w-full">Save All Changes</Button>
              </form>
            </Form>
            <DialogFooter className="sm:justify-between mt-4">
              <Button variant="destructive" onClick={() => setRemoveWarningOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove {selectedPerson?.name}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={removeWarningOpen} onOpenChange={setRemoveWarningOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete '{selectedPerson?.name}' and all their
                connections from the database. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
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
);

ModifyConnectionForm.displayName = 'ModifyConnectionForm';
