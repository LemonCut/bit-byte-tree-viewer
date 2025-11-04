
'use client';

import { useState } from 'react';
import type { Connection } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { AddConnectionForm } from './add-connection-form';
import { deleteConnection } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { useDebounce } from 'use-debounce';

interface ManageConnectionsProps {
  connections: Connection[];
  people: string[];
  trees: string[];
}

export function ManageConnections({ connections, people, trees }: ManageConnectionsProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const handleDelete = async (id: string) => {
    const result = await deleteConnection(id);
    if (result.success) {
      toast({
        title: 'Success!',
        description: result.message,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  };

  const filteredConnections = connections.filter(c => {
    const search = debouncedSearchTerm.toLowerCase();
    return (
      c.bit.toLowerCase().includes(search) ||
      c.byte.toLowerCase().includes(search) ||
      c.tree.toLowerCase().includes(search) ||
      c.year.toString().includes(search)
    );
  }).sort((a, b) => a.tree.localeCompare(b.tree) || a.year - b.year);

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg">Manage Connections</CardTitle>
        <CardDescription>
          View, edit, or delete existing connections.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Input 
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
        />
        <div className="max-h-96 overflow-y-auto border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary">
              <TableRow>
                <TableHead>Bit</TableHead>
                <TableHead>Byte</TableHead>
                <TableHead>Tree</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConnections.map((conn) => (
                <TableRow key={conn.id}>
                  <TableCell>{conn.bit}</TableCell>
                  <TableCell>{conn.byte}</TableCell>
                  <TableCell>{conn.tree}</TableCell>
                  <TableCell>{conn.year}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <AddConnectionForm
                      connection={conn}
                      people={people}
                      trees={trees}
                    />
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the connection between {conn.bit} and {conn.byte}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(conn.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredConnections.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-4">No connections found.</p>
        )}
      </CardContent>
    </Card>
  );
}
