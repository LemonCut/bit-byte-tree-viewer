'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TreeSelectorProps = {
  trees: string[];
  defaultTree: string;
};

export function TreeSelector({ trees, defaultTree }: TreeSelectorProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSelect = (treeName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (treeName) {
      params.set('tree', treeName);
    } else {
      params.delete('tree');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleSelect} defaultValue={defaultTree}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a tree" />
      </SelectTrigger>
      <SelectContent>
        {trees.map((tree) => (
          <SelectItem key={tree} value={tree}>
            {tree}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
