
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Connection, Person } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { Pencil, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';

const SearchSchema = z.object({
  personName: z.string().min(1, "Person's name is required."),
  personId: z.string().optional(),
});

const ModifySchema = z.object({
  personId: z.string(),
  newPersonName: z.string().min(1, "Person's name cannot be empty."),
  connections: z.array(z.object({
    id: z.string(),
    bitId: z.string(),
    bitName: z.string(),
    byteId: z.string(),
    byteName: z.string(),
    treeName: z.string().min(1, 'Tree name is required.'),
    year: z.coerce
      .number()
      .min(1900, 'Please enter a valid year.')
      .max(new Date().getFullYear() + 1, 'Year cannot be in the distant future.'),
  })),
});

type ModifyConnectionFormProps = {
  allPeople: Person[];
  allTrees: string[];
  connections: Connection[];
};

export function ModifyConnectionForm({
  allPeople,
  allTrees,
  connections,
}: ModifyConnectionFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  const searchForm = useForm<z.infer<typeof SearchSchema>>({
    resolver: zodResolver(SearchSchema),
    defaultValues: { personName: '', personId: '' },
  });

  const modifyForm = useForm<z.infer<typeof ModifySchema>>({
    resolver: zodResolver(ModifySchema),
  });
  
  const { fields, replace } = useFieldArray({
    control: modifyForm.control,
    name: 'connections',
  });

  const personNameValue = searchForm.watch('personName');
  const matchingPeople = useMemo(() => {
    if (!personNameValue) return [];
    return allPeople.filter(p => p.name.toLowerCase() === personNameValue.toLowerCase());
  }, [personNameValue, allPeople]);

  function onSearch({ personName, personId }: z.infer<typeof SearchSchema>) {
    let personToEdit: Person | undefined;

    if (matchingPeople.length === 1) {
        personToEdit = matchingPeople[0];
    } else if (matchingPeople.length > 1) {
        if (!personId) {
            toast({ variant: 'destructive', title: 'Multiple People Found', description: `Please select an ID for '${personName}'.`});
            return;
        }
        personToEdit = allPeople.find(p => p.id === personId);
    } else {
        personToEdit = allPeople.find(p => p.name.toLowerCase() === personName.toLowerCase());
    }

    if (!personToEdit) {
      toast({ variant: 'destructive', title: 'Not Found', description: `No person named '${personName}' found.` });
      return;
    }
    
    const relatedConnections = connections.filter((c) => c.bitId === personToEdit!.id || c.byteId === personToEdit!.id);
    
    setSelectedPerson(personToEdit);
    modifyForm.reset({
        personId: personToEdit.id,
        newPersonName: personToEdit.name,
    });
    replace(relatedConnections); // Populate the field array
    setDialogOpen(true);
  }

  async function onModify(data: z.infer<typeof ModifySchema>) {
    if (!firestore || !selectedPerson) return;
    
    const { personId, newPersonName, connections: modifiedConnections } = data;
    const oldPersonName = selectedPerson.name;

    try {
        const batch = writeBatch(firestore);
        const connectionsRef = collection(firestore, 'connections');

        // Update name where the person is a 'bit'
        const bitQuery = query(connectionsRef, where('bitId', '==', personId));
        const bitQuerySnapshot = await getDocs(bitQuery);
        bitQuerySnapshot.forEach((doc) => {
            batch.update(doc.ref, { bitName: newPersonName });
        });

        // Update name where the person is a 'byte'
        const byteQuery = query(connectionsRef, where('byteId', '==', personId));
        const byteQuerySnapshot = await getDocs(byteQuery);
        byteQuerySnapshot.forEach((doc) => {
            batch.update(doc.ref, { byteName: newPersonName });
        });

        // Update the specific connections from the form
        modifiedConnections.forEach(conn => {
            const docRef = doc(firestore, 'connections', conn.id);
            const updatePayload: Partial<Connection> = {
                treeName: conn.treeName,
                year: conn.year,
            };
            // Update names in the specific connection record as well
            if (conn.bitId === personId) updatePayload.bitName = newPersonName;
            if (conn.byteId === personId) updatePayload.byteName = newPersonName;
            
            // This part is tricky - we don't allow re-assigning bit/byte in this UI
            // but we need to ensure the names are correct if the main person name changed.
            // The logic above handles the name change across all records.
            // Here we only update year and tree.
            batch.update(docRef, {
                treeName: conn.treeName,
                year: conn.year,
            });
        });

        await batch.commit();

        toast({
            title: 'Success!',
            description: `Details for '${oldPersonName}' updated successfully.`,
        });

      setDialogOpen(false);
      searchForm.reset();

    } catch (error) {
      console.error('Error updating documents: ', error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'There was a problem updating the connections.'});
    }
  }

  const handleDeletePerson = async () => {
    if (!firestore || !selectedPerson) return;

    try {
        const batch = writeBatch(firestore);
        const connectionsRef = collection(firestore, 'connections');
        
        // Find connections where the person is a 'bit'
        const bitQuery = query(connectionsRef, where('bitId', '==', selectedPerson.id));
        const bitQuerySnapshot = await getDocs(bitQuery);
        bitQuerySnapshot.forEach((doc) => batch.delete(doc.ref));

        // Find connections where the person is a 'byte'
        const byteQuery = query(connectionsRef, where('byteId', '==', selectedPerson.id));
        const byteQuerySnapshot = await getDocs(byteQuery);
        byteQuerySnapshot.forEach((doc) => batch.delete(doc.ref));
        
        await batch.commit();

        toast({ title: 'Success!', description: `Successfully removed '${selectedPerson.name}' and all associated connections.`});
        setDeleteWarningOpen(false);
        setDialogOpen(false);
        searchForm.reset();

    } catch (error) {
        console.error("Error removing documents: ", error);
        toast({ variant: 'destructive', title: 'Deletion Failed', description: 'There was a problem removing the person.'});
    }
  };

  const allPeopleNames = useMemo(() => Array.from(new Set(allPeople.map(p => p.name))), [allPeople]);


  return (
    <>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg">Modify / Remove Person</CardTitle>
          <CardDescription>
            Find a person to edit their name or remove them.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4" >
              <FormField control={searchForm.control} name="personName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name to find" {...field} list="all-people-list" />
                    </FormControl>
                     <datalist id="all-people-list">
                      {allPeopleNames.map((name) => (<option key={name} value={name} />))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {matchingPeople.length > 1 && (
                 <FormField control={searchForm.control} name="personId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Person's ID</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder={`Select ID for ${personNameValue}`} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {matchingPeople.map(person => (
                                <SelectItem key={person.id} value={person.id}>
                                    {person.id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}
              <Button type="submit" className="w-full" disabled={!firestore} >
                <Pencil className="mr-2 h-4 w-4" /> Find & Modify
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modify Details for {selectedPerson?.name}</DialogTitle>
            <DialogDescription>
              Edit name and connection details. Changes will apply to all records.
            </DialogDescription>
          </DialogHeader>
           <Form {...modifyForm}>
                <form onSubmit={modifyForm.handleSubmit(onModify)} className="space-y-4 pt-4">
                    <FormField control={modifyForm.control} name="newPersonName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Person's New Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={modifyForm.control} name="personId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Person ID</FormLabel>
                          <FormControl><Input {...field} readOnly className="bg-muted"/></FormControl>
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
                                {field.bitId === selectedPerson?.id
                                    ? `Bit to ${field.byteName}`
                                    : `Byte for ${field.bitName}`
                                } in <span className="text-foreground font-semibold">{field.treeName}</span>
                              </p>
                              <FormField control={modifyForm.control} name={`connections.${index}.treeName`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tree Name</FormLabel>
                                    <FormControl><Input {...field} list="all-trees-list" /></FormControl>
                                    <datalist id="all-trees-list">
                                        {allTrees.map((tree) => (<option key={tree} value={tree} />))}
                                    </datalist>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                               <FormField control={modifyForm.control} name={`connections.${index}.year`} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Year of Pickup</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                          </div>  
                        ))}
                        </div>
                    </ScrollArea>
                    <Button type="submit" className="w-full">Save All Changes</Button>
                </form>
            </Form>
          <DialogFooter className="sm:justify-between pt-4">
             <Button type="button" variant="destructive" onClick={() => setDeleteWarningOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Person
             </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <AlertDialog open={deleteWarningOpen} onOpenChange={setDeleteWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete '{selectedPerson?.name}' and all their connections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePerson} className="bg-destructive hover:bg-destructive/90">Confirm & Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
