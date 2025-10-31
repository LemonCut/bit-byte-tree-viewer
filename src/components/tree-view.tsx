import type { TreeNode as TreeNodeType } from '@/lib/types';
import { TreeNode } from './tree-node';

interface TreeViewProps {
  data: TreeNodeType[];
}

export function TreeView({ data }: TreeViewProps) {
  return (
    <div className="space-y-2">
      {data.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </div>
  );
}
