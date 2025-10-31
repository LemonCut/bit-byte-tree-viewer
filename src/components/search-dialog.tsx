'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { searchPeople } from '@/lib/data';
import type { Connection, SearchResult } from '@/lib/types';
import { Separator } from './ui/separator';

interface SearchDialogProps {
  connections: Connection[];
}

export function SearchDialog({ connections }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchPeople(connections, query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search Database</DialogTitle>
          <DialogDescription>
            Search for any person in the database.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            id="search"
            placeholder="Type a name to search..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        {searchResults.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            <ul className="space-y-4">
              {searchResults.map((person) => (
                <li key={person.name}>
                  <h3 className="font-bold">{person.name}</h3>
                  <ul className="pl-4 space-y-1 mt-1">
                    {person.connections.map((conn, index) => (
                      <li key={`${conn.treeName}-${index}`} className="text-sm text-muted-foreground">
                        <Link 
                          href={`/?tree=${encodeURIComponent(conn.treeName)}&highlight=${encodeURIComponent(person.id)}`}
                          onClick={() => handleOpenChange(false)}
                          className="hover:underline hover:text-primary"
                        >
                            {conn.isRoot
                            ? `${conn.treeName} Tree - Root Byte`
                            : `${conn.treeName} Tree - ${conn.year} - ${conn.byte}'s Bit`}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Separator className="mt-4"/>
                </li>
              ))}
            </ul>
          </div>
        )}
         {searchQuery && searchResults.length === 0 && (
            <p className="text-center text-muted-foreground">No results found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
