
'use client';

import { Button } from '@/components/ui/button';
import type { TreeNode } from '@/lib/types';
import { Shuffle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ShuffleLayoutButtonProps = {
  treeData: TreeNode[] | null;
  onShuffle: (shuffledData: TreeNode[]) => void;
};

// Fisher-Yates (aka Knuth) Shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Deep copy and shuffle children recursively
function shuffleTree(nodes: TreeNode[]): TreeNode[] {
  return shuffleArray(nodes).map(node => {
    // Create a new node object to avoid direct mutation
    const newNode = { ...node };
    if (newNode.children && newNode.children.length > 0) {
      // Recursively shuffle children
      newNode.children = shuffleTree(newNode.children);
    }
    return newNode;
  });
}


export function ShuffleLayoutButton({
  treeData,
  onShuffle,
}: ShuffleLayoutButtonProps) {
  const handleShuffle = () => {
    if (treeData) {
      const shuffled = shuffleTree(treeData);
      onShuffle(shuffled);
    }
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg">Shuffle Layout</CardTitle>
        <CardDescription>
            Randomize the visual layout of the current tree.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Button
          onClick={handleShuffle}
          className="w-full"
          variant="outline"
          disabled={!treeData || treeData.length === 0}
        >
          <Shuffle className="mr-2 h-4 w-4" /> Shuffle Layout
        </Button>
      </CardContent>
    </Card>
  );
}

    