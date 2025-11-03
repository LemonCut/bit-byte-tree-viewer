
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect } from 'react';

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
import { collection, doc, writeBatch, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Pencil, Trash2 } from 'lucide-react';
import { updatePersonNameInConnections } from '@/lib/data';

const SearchSchema = z.object({
  personName: z.string().min(1, "Person's name is required."),
});

const ModifySchema = z.object({
  connectionId: z.string().optional(),
  originalBitName: z.string(),
  bitName: z.string().min(1, 'Bit name is required'),
  byteName: z.string().min(1, 'Byte name is required'),
  treeName: z.string().min(1, 'Tree name is required'),
  year: z.coerce
    .number()
    .min(1900, 'Please enter a valid year.')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the distant future.'),
});


type ModifyConnectionFormProps = {
  connections: Connection[];
  allPeople: Person[];
};

export function ModifyConnectionForm({ connections, allPeople }: ModifyConnectionFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
    const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

    const searchForm = useForm<z.infer<typeof SearchSchema>>({
      resolver: zodResolver(SearchSchema),
      defaultValues: { personName: '' },
    });

    const modifyForm = useForm<z.infer<typeof ModifySchema>>({
      resolver: zodResolver(ModifySchema),
    });
    
    useEffect(() => {
        if (selectedConnection) {
            modifyForm.reset({
                connectionId: selectedConnection.id,
                originalBitName: selectedConnection.bit,
                bitName: selectedConnection.bit,
                byteName: selectedConnection.byte,
                treeName: selectedConnection.tree,
                year: selectedConnection.year,
            });
        }
    }, [selectedConnection, modifyForm]);

    const onSearch = (data: z.infer<typeof SearchSchema>) => {
      const connectionAsBit = connections.find(
        (c) => c.bit.toLowerCase() === data.personName.toLowerCase()
      );

      if (!connectionAsBit) {
        toast({
          variant: 'destructive',
          title: 'Not Found',
          description: `No connection found where '${data.personName}' is a bit. Root bytes cannot be modified this way.`,
        });
        return;
      }
      
      setSelectedConnection(connectionAsBit);
      setModifyDialogOpen(true);
    };

    async function onModify(data: z.infer<typeof ModifySchema>) {
      if (!firestore || !data.connectionId) return;

      const batch = writeBatch(firestore);

      // Handle name change
      if (data.originalBitName !== data.bitName) {
        await updatePersonNameInConnections(firestore, batch, data.originalBitName, data.bitName);
      }
      
      // Update current connection details
      const docRef = doc(firestore, 'connections', data.connectionId);
      batch.update(docRef, {
          byte: data.byteName,
          tree: data.treeName,
          year: data.year,
          bit: data.bitName, // also update the bit name in the current connection
      });

      try {
        await batch.commit();
        toast({
          title: 'Success!',
          description: `Connection for '${data.bitName}' has been updated.`,
        });
        setModifyDialogOpen(false);
        searchForm.reset();
        setSelectedConnection(null);

      } catch (error) {
        console.error('Error updating document(s): ', error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'There was a problem updating the connection.',
        });
      }
    }
    
    const handleConfirmDelete = async () => {
      if (!firestore || !selectedConnection) return;
      const personNameToDelete = selectedConnection.bit;

      try {
        const batch = writeBatch(firestore);
        const connectionsCollection = collection(firestore, 'connections');
        
        // Find all connections where the person is a bit
        const bitQuery = query(connectionsCollection, where("bit", "==", personNameToDelete));
        const bitQuerySnapshot = await getDocs(bitQuery);
        bitQuerySnapshot.forEach(doc => batch.delete(doc.ref));

        // Find all connections where the person is a byte
        const byteQuery = query(connectionsCollection, where("byte", "==", personNameToDelete));
        const byteQuerySnapshot = await getDocs(byteQuery);
        byteQuerySnapshot.forEach(doc => batch.delete(doc.ref));

        await batch.commit();

        toast({
          title: 'Success!',
          description: `'${personNameToDelete}' and all their connections have been removed.`,
        });
        
      } catch (error) {
        console.error("Error removing documents: ", error);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem removing the person.',
        });
      } finally {
        setDeleteWarningOpen(false);
        setModifyDialogOpen(false);
        setSelectedConnection(null);
        searchForm.reset();
      }
    };

    const allPeopleNames = useMemo(() => allPeople.map(p => p.name).sort(), [allPeople]);
    const allBits = useMemo(() => Array.from(new Set(connections.map(c => c.bit))).sort(), [connections]);
    const allTrees = useMemo(() => Array.from(new Set(connections.map(c => c.tree || ''))).filter(Boolean).sort(), [connections]);

    return (
      <>
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg">Modify Bit</CardTitle>
            <CardDescription>
              Find a bit to edit their name or connection details.
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
                      <FormLabel>Bit's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name of bit to find" {...field} list="all-bits-list" />
                      </FormControl>
                      <datalist id="all-bits-list">
                        {allBits.map((name) => (
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modify Connection for {selectedConnection?.bit}</DialogTitle>
              <DialogDescription>
                Edit the details of this bit's name or their connection to their byte.
              </DialogDescription>
            </DialogHeader>
            <Form {...modifyForm}>
              <form onSubmit={modifyForm.handleSubmit(onModify)} className="space-y-6 pt-4">
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-6">
                     <div className="space-y-4 p-4 rounded-lg border">
                        <h3 className="text-base font-semibold">Bit Details</h3>
                        <FormField
                            control={modifyForm.control}
                            name="bitName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bit Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                        )} />
                     </div>
                     <div className="space-y-4 p-4 rounded-lg border">
                        <h3 className="text-base font-semibold">Byte Details</h3>
                      {selectedConnection ? (
                         <>
                          <FormField
                            control={modifyForm.control}
                            name="byteName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Byte Name</FormLabel>
                                    <FormControl><Input {...field} list="all-people-list" /></FormControl>
                                    <datalist id="all-people-list">
                                      {allPeopleNames.map(name => <option key={name} value={name} />)}
                                    </datalist>
                                    <FormMessage />
                                </FormItem>
                            )} />
                           <FormField
                            control={modifyForm.control}
                            name="treeName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tree Name</FormLabel>
                                    <FormControl><Input {...field} list="all-trees-list" /></FormControl>
                                    <datalist id="all-trees-list">
                                      {allTrees.map(tree => <option key={tree} value={tree} />)}
                                    </datalist>
                                    <FormMessage />
                                </FormItem>
                            )} />
                           <FormField
                            control={modifyForm.control}
                            name="year"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Year of Pickup</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                         </>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">N/A (This person is a root byte)</p>
                      )}
                    </div>
                  </div>
                </ScrollArea>
                
                <DialogFooter className="pt-6 border-t sm:justify-between">
                    <Button type="button" variant="destructive" onClick={() => setDeleteWarningOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Bit
                    </Button>
                    <div className="flex gap-2">
                         <DialogClose asChild>
                           <Button type="button" variant="secondary">Cancel</Button>
                         </DialogClose>
                         <Button type="submit">Save Changes</Button>
                    </div>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Confirmation for deleting the connection */}
        <AlertDialog open={deleteWarningOpen} onOpenChange={setDeleteWarningOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete '{selectedConnection?.bit}' and all of their connections from the database. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Confirm & Remove Bit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
}
