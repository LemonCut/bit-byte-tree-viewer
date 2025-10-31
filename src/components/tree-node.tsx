import { User, Users, GitFork } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { TreeNode as TreeNodeType } from '@/lib/types';

interface TreeNodeProps {
  node: TreeNodeType;
}

export function TreeNode({ node }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    return (
      <div className="flex items-center space-x-3 rounded-md border p-4 pl-5 shadow-sm">
        <User className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">{node.name}</span>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={node.id} className="border rounded-md shadow-sm">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-lg">{node.name}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pl-10 pr-4 pb-2 space-y-2">
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
