'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

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
import { useToast } from '@/hooks/use-toast';
import type { Connection } from '@/lib/types';

const FormSchema = z.object({
  big: z.string().min(1, 'Big name is required.'),
  little: z.string().min(1, 'Little name is required.'),
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
};

export function ConnectionForm({ currentTree, onAddConnection }: ConnectionFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      big: '',
      little: '',
      treeName: '',
      year: new Date().getFullYear(),
    },
  });
  
  function onSubmit(data: z.infer<typeof FormSchema>) {
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

  // If the current tree selection changes, update the placeholder in the form
  useEffect(() => {
    form.setValue('treeName', '');
  }, [currentTree, form]);


  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg">New Connection</CardTitle>
        <CardDescription>Add a new big/little relationship.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="big"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Big's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="little"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Little's Name</FormLabel>
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
  );
}
