
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { addConnection, updateConnection } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Connection } from '@/lib/types';
import { Plus, Pencil } from 'lucide-react';
import { Combobox } from './ui/combobox';

const connectionSchema = z.object({
  bit: z.string().min(1, 'Bit is required.'),
  byte: z.string().min(1, 'Byte is required.'),
  tree: z.string().min(1, 'Tree is required.'),
  year: z.coerce.number().min(1900, 'Year must be after 1900.').max(new Date().getFullYear() + 1, 'Year is in the future.'),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Connection' : 'Add Connection')}
    </Button>
  );
}

interface AddConnectionFormProps {
  connection?: Connection;
  people: string[];
  trees: string[];
}

export function AddConnectionForm({ connection, people, trees }: AddConnectionFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!connection;

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues: useMemo(() => ({
      bit: connection?.bit || '',
      byte: connection?.byte || '',
      tree: connection?.tree || '',
      year: connection?.year || new Date().getFullYear(),
    }), [connection]),
  });

  useEffect(() => {
    form.reset({
      bit: connection?.bit || '',
      byte: connection?.byte || '',
      tree: connection?.tree || '',
      year: connection?.year || new Date().getFullYear(),
    });
  }, [connection, form]);
  
  const action = isEditMode ? updateConnection : addConnection;
  const [state, formAction] = useFormState(action, { success: false, message: '' });

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      form.reset();
      toast({
        title: 'Success!',
        description: state.message,
      });
    } else if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast, form]);
  
  const peopleOptions = people.map(p => ({ label: p, value: p }));
  const treeOptions = trees.map(t => ({ label: t, value: t }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Connection
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modify Connection' : 'Add New Connection'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this connection.' : 'Add a new bit-byte relationship to the database.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            action={(formData) => {
              if (isEditMode && connection) {
                formData.set('id', connection.id);
              }
              formAction(formData);
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="byte"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Byte (Big)</FormLabel>
                  <FormControl>
                     <Combobox
                        options={peopleOptions}
                        placeholder="Select or create a person..."
                        value={field.value}
                        onChange={field.onChange}
                        allowCreate
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bit (Little)</FormLabel>
                   <FormControl>
                     <Combobox
                        options={peopleOptions}
                        placeholder="Select or create a person..."
                        value={field.value}
                        onChange={field.onChange}
                        allowCreate
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tree</FormLabel>
                   <FormControl>
                     <Combobox
                        options={treeOptions}
                        placeholder="Select or create a tree..."
                        value={field.value}
                        onChange={field.onChange}
                        allowCreate
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Year</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <SubmitButton isEditMode={isEditMode} />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
