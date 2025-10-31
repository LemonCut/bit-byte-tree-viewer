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
  onAddConnection: (connection: Connection) => void;
  allBits: string[];
  connections: Connection[];
};

export function ConnectionForm({ currentTree, onAddConnection, allBits, connections }: ConnectionFormProps) {
  const { toast } = useToast();
  const [warningOpen, setWarningOpen] = useState(false);
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
  
  const proceedWithSubmit = (data: z.infer<typeof FormSchema>) => {
    const finalTreeName = data.treeName || currentTree || 'Default Tree';
    const newConnection = { ...data, treeName: finalTreeName };
    onAddConnection(newConnection);
    toast({
        title: 'Success!',
        description: 'Connection added successfully.',
    });
    form.reset();
    form.setValue('year', new Date().getFullYear());
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const treeName = findBitInOtherTrees(connections, data.byte, data.treeName || currentTree);
    if (treeName) {
      setPendingData(data);
      setOtherTreeName(treeName);
      setWarningOpen(true);
    } else {
      proceedWithSubmit(data);
    }
  }
  
  const handleConfirm = () => {
    if (pendingData) {
      proceedWithSubmit(pendingData);
    }
    setWarningOpen(false);
    setPendingData(null);
    setOtherTreeName(null);
  };

  const handleCancel = () => {
    setWarningOpen(false);
    setPendingData(null);
    setOtherTreeName(null);
  };

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
                      <Input placeholder={currentTree !== 'No Trees Found' ? currentTree : 'Enter tree name'} {...field} />
                    </FormControl>
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
              
              <Button type="submit" className="w-full">
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
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}