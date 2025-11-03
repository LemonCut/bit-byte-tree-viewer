
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { collection, doc, writeBatch, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { Separator } from './ui/separator';

const SearchSchema = z.object({
  personName: z.string().min(1, "Person's name is required."),
});

const ModifySchema = z.object({
  originalName: z.string(),
  newName: z.string().min(1, "Person's name cannot be empty."),
  // Connection where this person is the BIT
  asBitConnection: z.object({
    id: z.string().optional(),
    byte: z.string().min(1, "Byte name is required"),
    tree: z.string().min(1, "Tree name is required"),
    year: z.coerce
      .number()
      .min(1900, 'Please enter a valid year.')
      .max(new Date().getFullYear() + 1, 'Year cannot be in the distant future.'),
  }).nullable(),
  // Connections where this person is the BYTE
  asByteConnections: z.array(z.object({
    id: z.string(),
    bit: z.string().min(1, "Bit name is required"),
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

export function ModifyConnectionForm({ connections, allPeople }: ModifyConnectionFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
    const [removeWarningOpen, setRemoveWarningOpen] = useState(false);
    const [removeBitWarning, setRemoveBitWarning] = useState<{connectionId: string, bitName: string} | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

    const searchForm = useForm<z.infer<typeof SearchSchema>>({
      resolver: zodResolver(SearchSchema),
      defaultValues: { personName: '' },
    });

    const modifyForm = useForm<z.infer<typeof ModifySchema>>({
      resolver: zodResolver(ModifySchema),
      defaultValues: {
        originalName: '',
        newName: '',
        asBitConnection: null,
        asByteConnections: []
      }
    });

    const { fields: asByteFields, append: appendAsByte, remove: removeAsByte } = useFieldArray({
      control: modifyForm.control,
      name: 'asByteConnections',
    });
    
    // Watch for changes to the form data to keep UI interactive
    const watchedNewName = modifyForm.watch('newName');

    const onSearch = (data: z.infer<typeof SearchSchema>) => {
      const person = allPeople.find(
        (p) => p.name.toLowerCase() === data.personName.toLowerCase()
      );

      if (!person) {
        toast({
          variant: 'destructive',
          title: 'Not Found',
          description: `No person named '${data.personName}' found.`,
        });
        return;
      }
      
      const connectionAsBit = connections.find(c => c.bit === person.name) || null;
      const connectionsAsByte = connections.filter(c => c.byte === person.name);

      setSelectedPerson(person);
      
      modifyForm.reset({
        originalName: person.name,
        newName: person.name,
        asBitConnection: connectionAsBit ? {
            id: connectionAsBit.id,
            byte: connectionAsBit.byte,
            tree: connectionAsBit.tree,
            year: connectionAsBit.year
        } : null,
        asByteConnections: connectionsAsByte.map(c => ({
            id: c.id,
            bit: c.bit,
            tree: c.tree,
            year: c.year
        }))
      });
      
      setModifyDialogOpen(true);
    };

    async function onModify(data: z.infer<typeof ModifySchema>) {
      if (!firestore || !selectedPerson) return;
      const { originalName, newName, asBitConnection, asByteConnections } = data;
      
      try {
        const batch = writeBatch(firestore);

        // 1. Handle name change across all connections
        if (originalName !== newName) {
          const bitQuery = query(collection(firestore, 'connections'), where('bit', '==', originalName));
          const bitDocs = await getDocs(bitQuery);
          bitDocs.forEach(d => batch.update(d.ref, { bit: newName }));

          const byteQuery = query(collection(firestore, 'connections'), where('byte', '==', originalName));
          const byteDocs = await getDocs(byteQuery);
          byteDocs.forEach(d => batch.update(d.ref, { byte: newName }));
        }

        // 2. Handle update to the connection where person is a bit
        if (asBitConnection?.id) {
             const docRef = doc(firestore, 'connections', asBitConnection.id);
             batch.update(docRef, {
                 byte: asBitConnection.byte,
                 tree: asBitConnection.tree,
                 year: asBitConnection.year
             });
        }
        
        // 3. Handle updates to connections where person is a byte
        asByteConnections.forEach(conn => {
            const originalConn = connections.find(c => c.id === conn.id);
            // If it's an existing connection, update it
            if (originalConn) {
                const docRef = doc(firestore, 'connections', conn.id);
                batch.update(docRef, {
                    bit: conn.bit,
                    tree: conn.tree,
                    year: conn.year
                });
            } else { // This is a newly added bit
                const newDocRef = doc(collection(firestore, 'connections'));
                batch.set(newDocRef, {
                    bit: conn.bit,
                    byte: newName, // Use the new name if it was changed
                    tree: conn.tree,
                    year: conn.year
                });
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

    const handleAddBit = () => {
      appendAsByte({
        // @ts-ignore - ID is generated by firestore, so we use a temp client-side one
        id: `new-${Date.now()}`,
        bit: '',
        tree: modifyForm.getValues('asByteConnections.0.tree') || '',
        year: new Date().getFullYear(),
      });
    };

    const handleDeleteBit = async () => {
      if (!firestore || !removeBitWarning) return;
      
      const { connectionId, bitName } = removeBitWarning;
      
      // If it's a new bit not yet in the DB, just remove from form state
      if (connectionId.startsWith('new-')) {
          const fieldIndex = asByteFields.findIndex(field => field.id === connectionId);
          if (fieldIndex > -1) {
              removeAsByte(fieldIndex);
          }
          toast({ title: 'Success!', description: 'New bit removed from form.' });
          setRemoveBitWarning(null);
          return;
      }
      
      try {
        const docRef = doc(firestore, 'connections', connectionId);
        await deleteDoc(docRef);

        const fieldIndex = asByteFields.findIndex(field => field.id === connectionId);
        if (fieldIndex > -1) {
            removeAsByte(fieldIndex);
        }
        
        toast({
          title: 'Success!',
          description: `Connection to bit '${bitName}' has been deleted.`,
        });
      } catch (error) {
        console.error("Error removing document: ", error);
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: `Could not delete connection to '${bitName}'.`,
        });
      } finally {
        setRemoveBitWarning(null);
      }
    };
    
    const handleConfirmDeletePerson = async () => {
      if (!firestore || !selectedPerson) return;
      const personToDelete = selectedPerson.name;

      try {
        const batch = writeBatch(firestore);

        const bitQuery = query(collection(firestore, 'connections'), where('bit', '==', personToDelete));
        const bitQuerySnapshot = await getDocs(bitQuery);
        bitQuerySnapshot.forEach((d) => batch.delete(d.ref));

        const byteQuery = query(collection(firestore, 'connections'), where('byte', '==', personToDelete));
        const byteQuerySnapshot = await getDocs(byteQuery);
        byteQuerySnapshot.forEach((d) => batch.delete(d.ref));

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

    const allPeopleNames = useMemo(() => allPeople.map(p => p.name).sort(), [allPeople]);
    const allTrees = useMemo(() => Array.from(new Set(connections.map(c => c.tree || ''))).filter(Boolean).sort(), [connections]);

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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modify Details for {selectedPerson?.name}</DialogTitle>
              <DialogDescription>
                Edit name and connection details. Changes will apply to all records.
              </DialogDescription>
            </DialogHeader>
            <Form {...modifyForm}>
              <form onSubmit={modifyForm.handleSubmit(onModify)} className="space-y-6 pt-4">
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-6">
                    {/* Name Section */}
                    <FormField
                      control={modifyForm.control}
                      name="newName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Connections Section */}
                    <h3 className="text-base font-semibold">Connections</h3>
                    
                    {/* As a Bit Section */}
                    <div className="space-y-4 p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-muted-foreground">As a Bit (Child)</h4>
                      {modifyForm.getValues('asBitConnection') ? (
                         <>
                          <FormField
                            control={modifyForm.control}
                            name="asBitConnection.byte"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Byte Name (Parent)</FormLabel>
                                    <FormControl><Input {...field} list="all-people-list" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                           <FormField
                            control={modifyForm.control}
                            name="asBitConnection.tree"
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
                            name="asBitConnection.year"
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

                    {/* As a Byte Section */}
                     <div className="space-y-4 p-4 rounded-lg border">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-muted-foreground">As a Byte (Parent)</h4>
                             <Button type="button" size="sm" variant="ghost" onClick={handleAddBit}>
                                <Plus className="mr-2 h-4 w-4" /> Add Bit
                            </Button>
                        </div>
                       {asByteFields.length === 0 ? (
                           <p className="text-sm text-muted-foreground italic">N/A (This person has no bits)</p>
                       ) : (
                         asByteFields.map((field, index) => (
                           <div key={field.id} className="space-y-3 p-3 rounded-md border bg-muted/20 relative">
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => setRemoveBitWarning({ connectionId: field.id, bitName: modifyForm.getValues(`asByteConnections.${index}.bit`) || 'new bit'})}
                              >
                               <X className="h-4 w-4" />
                             </Button>
                             <FormField
                                control={modifyForm.control}
                                name={`asByteConnections.${index}.bit`}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormLabel>Bit Name (Child)</FormLabel>
                                        <FormControl><Input {...formField} list="all-people-list" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                              <FormField
                                control={modifyForm.control}
                                name={`asByteConnections.${index}.tree`}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormLabel>Tree Name</FormLabel>
                                        <FormControl><Input {...formField} list="all-trees-list" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                               <FormField
                                control={modifyForm.control}
                                name={`asByteConnections.${index}.year`}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormLabel>Year of Pickup</FormLabel>
                                        <FormControl><Input type="number" {...formField} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                           </div>
                         ))
                       )}
                     </div>

                  </div>
                </ScrollArea>
                
                <DialogFooter className="pt-6 border-t sm:justify-between">
                    <Button type="button" variant="destructive" onClick={() => setRemoveWarningOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove {watchedNewName}
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

        {/* Confirmation for removing a person */}
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
                onClick={handleConfirmDeletePerson}
                className="bg-destructive hover:bg-destructive/90"
              >
                Confirm & Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirmation for removing a single bit connection */}
        <AlertDialog open={!!removeBitWarning} onOpenChange={(open) => !open && setRemoveBitWarning(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bit Connection?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the connection to '{removeBitWarning?.bitName}'? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRemoveBitWarning(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBit}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
}

    