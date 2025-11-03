
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';

type DisconnectedTreesProps = {
  treeNames: string[];
};

export function DisconnectedTrees({ treeNames }: DisconnectedTreesProps) {
  if (treeNames.length === 0) {
    return null;
  }

  return (
    <Card className="bg-destructive/10 border-destructive/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-lg text-destructive">Disconnected Trees</CardTitle>
            <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">{treeNames.length}</Badge>
        </div>
        <CardDescription className="text-destructive/90">
          These trees have multiple roots and may not be fully connected.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="space-y-1 text-sm list-disc pl-5">
          {treeNames.map(treeName => (
            <li key={treeName}>
              <Link
                href={`/?tree=${encodeURIComponent(treeName)}`}
                className="hover:underline text-destructive/90 hover:text-destructive font-medium"
              >
                {treeName}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
