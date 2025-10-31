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
import type { Connection } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { Pencil } from 'lucide-react';
import { Separator } from './ui/separator';

const SearchSchema = z.object({
  bitName: z.string().min(1, "Bit's name is required."),
});

const ModifySchema = z.object({
  id: z.string(),
  newBitName: z.string().min(1, "Bit's name is required."),
  byte: z.string().min(1, "Byte's name is required."),
  treeName: z.string().min(1, 'Tree name is required.'),
  year: z.coerce
    .number()
    .min(1900, 'Please enter a valid year.')
    .max(
      new Date().getFullYear() + 1,
      'Year cannot be in the distant future.'
    ),
});

type ModifyConnectionFormProps = {
  allBits: string[];
  allBytes: string[];
  allTrees: string[];
  connections: Connection[];
};

export function ModifyConnectionForm({
  allBits,
  allBytes,
  allTrees,
  connections,
}: ModifyConnectionFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBit, setSelectedBit] = useState<string | null>(null);
  const [bitConnections, setBitConnections] = useState<Connection[]>([]);

  const searchForm = useForm<z.infer<typeof SearchSchema>>({
    resolver: zodResolver(SearchSchema),
    defaultValues: { bitName: '' },
  });

  const modifyForm = useForm<z.infer<typeof ModifySchema>>({
    resolver: zodResolver(ModifySchema),
  });

  function onSearch({ bitName }: z.infer<typeof SearchSchema>) {
    const foundConnections = connections.filter((c) => c.bit.toLowerCase() === bitName.toLowerCase());

    if (foundConnections.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Not Found',
        description: `No connections found where '${bitName}' is a Bit.`,
      });
      return;
    }
    
    modifyForm.reset();
    setSelectedBit(bitName);
    setBitConnections(foundConnections);
    setDialogOpen(true);
    // Set the initial value for the new bit name field
    modifyForm.setValue('newBitName', bitName);
  }

  async function onModify(data: z.infer<typeof ModifySchema>) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database connection not found.',
      });
      return;
    }
    
    const oldBitName = selectedBit;
    const { newBitName } = modifyForm.getValues();

    if (!oldBitName) return;

    try {
        const batch = writeBatch(firestore);
        const connectionsRef = collection(firestore, 'connections');

        // Update name where the person is a 'bit'
        const bitQuery = query(connectionsRef, where('bit', '==', oldBitName));
        const bitQuerySnapshot = await getDocs(bitQuery);
        bitQuerySnapshot.forEach((doc) => {
            batch.update(doc.ref, { bit: newBitName });
        });

        // Update name where the person is a 'byte'
        const byteQuery = query(connectionsRef, where('byte', '==', oldBitName));
        const byteQuerySnapshot = await getDocs(byteQuery);
        byteQuerySnapshot.forEach((doc) => {
            batch.update(doc.ref, { byte: newBitName });
        });

        // Update the specific connection from the form
        const docRef = doc(firestore, 'connections', data.id);
        batch.update(docRef, {
            bit: newBitName, // ensure the bit name is updated here too
            byte: data.byte,
            treeName: data.treeName,
            year: data.year,
        });

        await batch.commit();

      toast({
        title: 'Success!',
        description: `Connection details for '${oldBitName}' updated to '${newBitName}' successfully.`,
      });

      setDialogOpen(false);
      searchForm.reset();

    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem updating the connections.',
      });
    }
  }

  return (
    <>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg">Modify Connection</CardTitle>
          <CardDescription>
            Find a Bit to edit their name and connection details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...searchForm}>
            <form
              onSubmit={searchForm.handleSubmit(onSearch)}
              className="space-y-4"
            >
              <FormField
                control={searchForm.control}
                name="bitName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bit's Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Bit's name to modify"
                        {...field}
                        list="all-bits-list"
                      />
                    </FormControl>
                     <datalist id="all-bits-list">
                      {allBits.map((bit) => (
                        <option key={bit} value={bit} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={!firestore}
              >
                <Pencil className="mr-2 h-4 w-4" /> Modify Connection
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modify Connections for {selectedBit}</DialogTitle>
            <DialogDescription>
              Edit the Bit's name, and their connection details below. Click save for each connection you change.
            </DialogDescription>
          </DialogHeader>
           <Form {...modifyForm}>
                <form className="space-y-4 pt-4">
                    <FormField
                      control={modifyForm.control}
                      name="newBitName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bit's New Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter new name for the Bit"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </form>
            </Form>
          <Separator />
          <ScrollArea className="max-h-[50vh]">
            <div className="p-1 space-y-4">
            {bitConnections.map((connection) => (
              <div key={connection.id}>
                <Form {...modifyForm}>
                  <form
                     onSubmit={modifyForm.handleSubmit(onModify)}
                    className="space-y-4 p-4 rounded-lg border"
                  >
                     <FormField
                      control={modifyForm.control}
                      name="id"
                      defaultValue={connection.id}
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <p className="text-sm font-medium text-muted-foreground">Connection to <span className="text-foreground font-semibold">{connection.byte}</span> in <span className="text-foreground font-semibold">{connection.treeName}</span></p>
                    <FormField
                      control={modifyForm.control}
                      name="byte"
                      defaultValue={connection.byte}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Byte's Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Byte's name"
                              {...field}
                              list="all-bytes-list"
                            />
                          </FormControl>
                          <datalist id="all-bytes-list">
                            {allBytes.map((byte) => (
                              <option key={byte} value={byte} />
                            ))}
                          </datalist>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={modifyForm.control}
                      name="treeName"
                       defaultValue={connection.treeName}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tree Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter tree name"
                              {...field}
                              list="all-trees-list"
                            />
                          </FormControl>
                           <datalist id="all-trees-list">
                            {allTrees.map((tree) => (
                              <option key={tree} value={tree} />
                            ))}
                          </datalist>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={modifyForm.control}
                      name="year"
                       defaultValue={connection.year}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year of Pickup</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Save Changes
                    </Button>
                  </form>
                </Form>
                </div>
            ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
