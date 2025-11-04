
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
import { Trash2, Pencil } from 'lucide-react';
import { AddConnectionForm } from './add-connection-form';
import { deleteConnection } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from './ui/combobox';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface ManageConnectionsProps {
  connections: Connection[];
  people: string[];
  trees: string[];
}

export function ManageConnections({ connections, people, trees }: ManageConnectionsProps) {
  const { toast } = useToast();
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const result = await deleteConnection(id);
    if (result.success) {
      toast({
        title: 'Success!',
        description: result.message,
      });
      // If we deleted the last connection for a person, reset the view
      const remainingConnections = personConnections.filter(c => c.id !== id);
      if (remainingConnections.length === 0) {
        setSelectedPerson(null);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  };
  
  const handleSelectPerson = (person: string) => {
    setSelectedPerson(person);
  };
  
  const peopleOptions = people.map(p => ({ label: p, value: p }));
  
  const personConnections = selectedPerson
    ? connections.filter(c => c.bit === selectedPerson || c.byte === selectedPerson)
    : [];

  const getRole = (connection: Connection) => {
    if (connection.byte === selectedPerson) {
      return { role: 'Byte of', other: connection.bit };
    }
    return { role: 'Bit of', other: connection.byte };
  };

  const editingConnection = connections.find(c => c.id === editingConnectionId);

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg">Manage Connections</CardTitle>
        <CardDescription>
          Search for a person to view and edit their connections.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Combobox
            options={peopleOptions}
            value={selectedPerson || ''}
            onChange={handleSelectPerson}
            placeholder="Search for a person..."
        />
        
        {selectedPerson && (
            <div className="mt-4">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{selectedPerson}'s Connections</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPerson(null)}>Clear</Button>
                </div>
                {personConnections.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {personConnections.map(conn => {
                            const { role, other } = getRole(conn);
                            return (
                                <Card key={conn.id} className="p-3">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm">
                                            <p><Badge variant="secondary" className="mr-2">{role}</Badge> {other}</p>
                                            <p className="text-muted-foreground mt-1">{conn.tree} - {conn.year}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => setEditingConnectionId(conn.id)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the connection.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive hover:bg-destructive/90"
                                                            onClick={() => handleDelete(conn.id)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                ): (
                    <p className="text-center text-sm text-muted-foreground mt-4">No connections found for {selectedPerson}.</p>
                )}
            </div>
        )}

        {editingConnection && (
            <AddConnectionForm
                connection={editingConnection}
                people={people}
                trees={trees}
                open={!!editingConnectionId}
                onOpenChange={(isOpen) => !isOpen && setEditingConnectionId(null)}
            />
        )}
      </CardContent>
    </Card>
  );
}
