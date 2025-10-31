import type { TreeNode as TreeNodeType } from '@/lib/types';
import { TreeNode } from './tree-node';

interface TreeViewProps {
  data: TreeNodeType[];
}

export function TreeView({ data }: TreeViewProps) {
  return (
    <div className="space-y-4">
      {data.map((node, index) => (
        <div key={node.id} className="relative">
          <TreeNode node={node} isLast={index === data.length - 1} />
        </div>
      ))}
    </div>
  );
}
