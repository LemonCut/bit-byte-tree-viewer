'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type TreeSelectorProps = {
  trees: string[];
  defaultTree: string;
  className?: string;
  hasUnassigned?: boolean;
};

export function TreeSelector({ trees, defaultTree, className, hasUnassigned }: TreeSelectorProps) {
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
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder="Select a tree" />
      </SelectTrigger>
      <SelectContent>
        {hasUnassigned && (
            <>
                <SelectItem value="Unassigned">
                    Unassigned
                </SelectItem>
                <SelectSeparator />
            </>
        )}
        {trees.map((tree) => (
          <SelectItem key={tree} value={tree}>
            {tree}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
