
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useMemo } from 'react';

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
import type { Connection, Person } from '@/lib/types';
import { findBitInOtherTrees, generateId } from '@/lib/data';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const FormSchema = z.object({
  byteName: z.string().min(1, 'Byte name is required.'),
  byteId: z.string().optional(),
  bitName: z.string().min(1, 'Bit name is required.'),
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
  allPeople: Person[];
  connections: Connection[];
  allTrees: string[];
};

export function ConnectionForm({ currentTree, allPeople, connections, allTrees }: ConnectionFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [warningOpen, setWarningOpen] = useState(false);
  const [treeNameWarningOpen, setTreeNameWarningOpen] = useState(false);
  const [pendingData, setPendingData] = useState<z.infer<typeof FormSchema> | null>(null);
  const [otherTreeName, setOtherTreeName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      byteName: '',
      byteId: '',
      bitName: '',
      treeName: '',
      year: new Date().getFullYear(),
    },
  });

  const byteNameValue = form.watch('byteName');
  
  const matchingBytes = useMemo(() => {
    if (!byteNameValue) return [];
    return allPeople.filter(p => p.name.toLowerCase() === byteNameValue.toLowerCase());
  }, [byteNameValue, allPeople]);

  // Effect to handle auto-selection or dropdown logic for byteId
  useEffect(() => {
    if (matchingBytes.length === 1) {
      form.setValue('byteId', matchingBytes[0].id);
    } else {
      // If there are multiple matches or no matches, clear the byteId
      // The user will have to select from the dropdown if multiple
      form.setValue('byteId', ''); 
    }
  }, [matchingBytes, form]);
  
  const proceedWithSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database connection not found.',
      });
      return;
    }
    
    // Determine the byteId. If not set (new person), generate one.
    const byteId = data.byteId || (matchingBytes.length === 1 ? matchingBytes[0].id : generateId());
    
    // Generate a new ID for the new bit, as each "bit" is a new person in a new context
    const bitId = generateId();

    const finalTreeName = data.treeName || currentTree || 'Default Tree';
    
    const newConnection = { 
        bitId,
        bitName: data.bitName,
        byteId,
        byteName: data.byteName,
        treeName: finalTreeName,
        year: data.year,
        createdAt: serverTimestamp() 
    };
    
    try {
      await addDoc(collection(firestore, 'connections'), newConnection);
      toast({
          title: 'Success!',
          description: 'Connection added successfully.',
      });
      form.reset({
        byteName: '',
        byteId: '',
        bitName: '',
        treeName: '',
        year: new Date().getFullYear(),
      });
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
    if (matchingBytes.length > 1 && !data.byteId) {
        toast({
            variant: 'destructive',
            title: 'Multiple People Found',
            description: `Multiple people named '${data.byteName}' exist. Please select the correct ID.`,
        });
        return;
    }

    // If tree name ends with tree (case-insensitive) but is not just "Tree"
    if (data.treeName.toLowerCase().endsWith('tree') && data.treeName.length > 4) {
        setPendingData(data);
        setTreeNameWarningOpen(true);
        return;
    }

    const byteIdToCheck = data.byteId || (matchingBytes.length === 1 ? matchingBytes[0].id : null);
    if (byteIdToCheck) {
        const treeName = findBitInOtherTrees(connections, byteIdToCheck, data.treeName || currentTree);
        if (treeName) {
          setPendingData(data);
          setOtherTreeName(treeName);
          setWarningOpen(true);
          return;
        }
    }

    proceedWithSubmit(data);
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
        const byteIdToCheck = pendingData.byteId || (matchingBytes.length === 1 ? matchingBytes[0].id : null);
        if (byteIdToCheck) {
            const treeName = findBitInOtherTrees(connections, byteIdToCheck, pendingData.treeName || currentTree);
            if (treeName) {
                setOtherTreeName(treeName);
                setWarningOpen(true);
                return;
            }
        }
        proceedWithSubmit(pendingData);
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

  const allPeopleNames = useMemo(() => Array.from(new Set(allPeople.map(p => p.name))), [allPeople]);


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
                name="byteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Byte's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name or create new" {...field} list="people-list" />
                    </FormControl>
                    <datalist id="people-list">
                      {allPeopleNames.map((name, index) => <option key={`${name}-${index}`} value={name} />)}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {matchingBytes.length > 1 && (
                 <FormField
                    control={form.control}
                    name="byteId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Byte's ID</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder={`Select ID for ${byteNameValue}`} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {matchingBytes.map(person => (
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
               {matchingBytes.length === 1 && (
                 <FormField
                    control={form.control}
                    name="byteId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Byte's ID</FormLabel>
                        <FormControl>
                            <Input placeholder="ID auto-filled" {...field} readOnly className="bg-muted"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}

              <FormField
                control={form.control}
                name="bitName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bit's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter new bit's name" {...field} />
                    </FormControl>
                     <FormDescription>Each new Bit is treated as a new person.</FormDescription>
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
              The person you entered as a Byte, '{pendingData?.byteName}', already exists as a Bit in the '{otherTreeName}' tree. Are you sure you want to add them as a Byte to this new tree?
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
