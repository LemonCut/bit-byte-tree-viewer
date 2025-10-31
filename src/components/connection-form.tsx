'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';

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
import { useToast } from '@/hooks/use-toast';
import type { Connection } from '@/lib/types';
import { findBitInOtherTrees } from '@/lib/data';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const FormSchema = z.object({
  byte: z.string().min(1, 'Byte name is required.'),
  bit: z.string().min(1, 'Bit name is required.'),
  treeName: z.string(), // can be empty
  year: z.coerce
    .number()
    .min(1900, 'Please enter a valid year.')
    .max(
      new Date().getFullYear() + 1,
      'Year cannot be in the distant future.'
    ),
});

type ConnectionFormProps = {
  currentTree: string;
  allBits: string[];
  connections: Connection[];
  allTrees: string[];
};

export function ConnectionForm({ currentTree, allBits, connections, allTrees }: ConnectionFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [warningOpen, setWarningOpen] = useState(false);
  const [treeNameWarningOpen, setTreeNameWarningOpen] = useState(false);
  const [pendingData, setPendingData] = useState<z.infer<typeof FormSchema> | null>(null);
  const [otherTreeName, setOtherTreeName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      byte: '',
      bit: '',
      treeName: '',
      year: new Date().getFullYear(),
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
    const finalTreeName = data.treeName || currentTree || 'Default Tree';
    const newConnection = { ...data, treeName: finalTreeName, createdAt: serverTimestamp() };
    
    try {
      await addDoc(collection(firestore, 'connections'), newConnection);
      toast({
          title: 'Success!',
          description: 'Connection added successfully.',
      });
      form.reset();
      form.setValue('year', new Date().getFullYear());
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem saving the connection.',
      });
    } finally {
      setPendingData(null);
    }
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // If tree name ends with tree (case-insensitive) but is not just "Tree"
    if (data.treeName.toLowerCase().endsWith('tree') && data.treeName.length > 4) {
        setPendingData(data);
        setTreeNameWarningOpen(true);
        return;
    }

    const treeName = findBitInOtherTrees(connections, data.byte, data.treeName || currentTree);
    if (treeName) {
      setPendingData(data);
      setOtherTreeName(treeName);
      setWarningOpen(true);
    } else {
      proceedWithSubmit(data);
    }
  }

  const handleByteWarningConfirm = () => {
    if (pendingData) {
      proceedWithSubmit(pendingData);
    }
    setWarningOpen(false);
    setPendingData(null);
    setOtherTreeName(null);
  };

  const handleByteWarningCancel = () => {
    setWarningOpen(false);
    setPendingData(null);
    setOtherTreeName(null);
  };
  
  const handleTreeNameWarningConfirm = () => {
    setTreeNameWarningOpen(false);
    if (pendingData) {
        const treeName = findBitInOtherTrees(connections, pendingData.byte, pendingData.treeName || currentTree);
        if (treeName) {
            setOtherTreeName(treeName);
            setWarningOpen(true);
        } else {
            proceedWithSubmit(pendingData);
        }
    }
  }

  const handleTreeNameWarningCancel = () => {
    setTreeNameWarningOpen(false);
    setPendingData(null);
  }

  // If the current tree selection changes, update the placeholder in the form
  useEffect(() => {
    form.setValue('treeName', '');
  }, [currentTree, form]);


  return (
    <>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg">New Connection</CardTitle>
          <CardDescription>Add a new bit/byte relationship.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="byte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Byte's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} list="bits-list" />
                    </FormControl>
                    <datalist id="bits-list">
                      {allBits.map(bit => <option key={bit} value={bit} />)}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bit's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="treeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tree Name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={currentTree !== 'No Trees Found' ? currentTree : 'Enter tree name'} 
                        {...field} 
                        list="trees-list"
                      />
                    </FormControl>
                     <datalist id="trees-list">
                      {allTrees.map(tree => <option key={tree} value={tree} />)}
                    </datalist>
                    <FormDescription>Defaults to the current tree if left blank.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
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
              
              <Button type="submit" className="w-full" disabled={!firestore}>
                Add Connection
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cross-Tree Connection Warning</AlertDialogTitle>
            <AlertDialogDescription>
              The person you entered as a Byte, '{pendingData?.byte}', already exists as a Bit in the '{otherTreeName}' tree. Are you sure you want to add them as a Byte to this new tree?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleByteWarningCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleByteWarningConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={treeNameWarningOpen} onOpenChange={setTreeNameWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tree Name Warning</AlertDialogTitle>
            <AlertDialogDescription>
              The tree name you entered, '{pendingData?.treeName}', seems to end with "Tree". This might be redundant. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleTreeNameWarningCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTreeNameWarningConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
