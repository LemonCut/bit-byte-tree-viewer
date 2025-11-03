
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
import { collection, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { Pencil, Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';

const SearchSchema = z.object({
  personName: z.string().min(1, "Person's name is required."),
});

const ModifySchema = z.object({
  connectionId: z.string().optional(),
  bitName: z.string(),
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
      
      modifyForm.reset({
        connectionId: connectionAsBit.id,
        bitName: connectionAsBit.bit,
        byteName: connectionAsBit.byte,
        treeName: connectionAsBit.tree,
        year: connectionAsBit.year,
      });
      
      setModifyDialogOpen(true);
    };

    async function onModify(data: z.infer<typeof ModifySchema>) {
      if (!firestore || !data.connectionId) return;

      try {
        const docRef = doc(firestore, 'connections', data.connectionId);
        await writeBatch(firestore).update(docRef, {
            byte: data.byteName,
            tree: data.treeName,
            year: data.year,
        }).commit();

        toast({
          title: 'Success!',
          description: `Connection for '${data.bitName}' has been updated.`,
        });
        setModifyDialogOpen(false);
        searchForm.reset();

      } catch (error) {
        console.error('Error updating document: ', error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'There was a problem updating the connection.',
        });
      }
    }
    
    const handleConfirmDelete = async () => {
      if (!firestore || !selectedConnection) return;

      try {
        const docRef = doc(firestore, 'connections', selectedConnection.id);
        await deleteDoc(docRef);

        toast({
          title: 'Success!',
          description: `Connection for '${selectedConnection.bit}' has been deleted.`,
        });
        setModifyDialogOpen(false);
        searchForm.reset();
      } catch (error) {
        console.error("Error removing document: ", error);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'There was a problem deleting the connection.',
        });
      } finally {
        setDeleteWarningOpen(false);
        setSelectedConnection(null);
      }
    };

    const allPeopleNames = useMemo(() => allPeople.map(p => p.name).sort(), [allPeople]);
    const allBits = useMemo(() => Array.from(new Set(connections.map(c => c.bit))).sort(), [connections]);
    const allTrees = useMemo(() => Array.from(new Set(connections.map(c => c.tree || ''))).filter(Boolean).sort(), [connections]);

    return (
      <>
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg">Modify Bit Connection</CardTitle>
            <CardDescription>
              Find a bit to edit their connection details.
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
                Edit the details of this bit's connection to their byte.
              </DialogDescription>
            </DialogHeader>
            <Form {...modifyForm}>
              <form onSubmit={modifyForm.handleSubmit(onModify)} className="space-y-6 pt-4">
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-6">
                    {/* Byte Details Section */}
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
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Connection
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
                This will permanently delete the connection between '{selectedConnection?.bit}' and '{selectedConnection?.byte}'. This action cannot be undone.
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
