
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
  currentTree?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddConnectionForm({ 
    connection, 
    people, 
    trees,
    currentTree,
    trigger,
    open: externalOpen,
    onOpenChange: externalOnOpenChange,
}: AddConnectionFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!connection;

  const open = externalOpen ?? internalOpen;
  const onOpenChange = externalOnOpenChange ?? setInternalOpen;
  
  const defaultTreeValue = connection?.tree || (currentTree && currentTree !== 'No Trees Found' ? currentTree : '');


  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues: useMemo(() => ({
      bit: connection?.bit || '',
      byte: connection?.byte || '',
      tree: defaultTreeValue,
      year: connection?.year || new Date().getFullYear(),
    }), [connection, defaultTreeValue]),
  });
  
  const action = isEditMode ? updateConnection : addConnection;

  const [state, formAction] = useFormState(action, {
    success: false,
    message: '',
  });
  
   useEffect(() => {
    if (state.message) {
      if (state.success) {
        onOpenChange(false);
        form.reset();
        toast({
          title: 'Success!',
          description: state.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message || 'An unknown error occurred.',
        });
      }
    }
  }, [state, onOpenChange, toast, form]);


  useEffect(() => {
    form.reset({
      bit: connection?.bit || '',
      byte: connection?.byte || '',
      tree: defaultTreeValue,
      year: connection?.year || new Date().getFullYear(),
    });
  }, [connection, form, open, defaultTreeValue]);
  
  const peopleOptions = people.map(p => ({ label: p, value: p }));
  const treeOptions = trees.map(t => ({ label: t, value: t }));

  const dialogTrigger = trigger ? (
    <DialogTrigger asChild>{trigger}</DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      {isEditMode ? (
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit Connection</span>
        </Button>
      ) : (
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      )}
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogTrigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modify Connection' : 'Add New Connection'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this connection.' : 'Add a new bit-byte relationship to the database.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
             action={formAction}
             onSubmit={form.handleSubmit(data => {
                const formData = new FormData();
                Object.entries(data).forEach(([key, value]) => {
                  formData.append(key, String(value));
                });
                if (isEditMode && connection?.id) {
                    formData.append('id', connection.id);
                }
                formAction(formData);
             })}
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
