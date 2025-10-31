import { User, Users } from 'lucide-react';
import type { TreeNode as TreeNodeType } from '@/lib/types';

interface TreeNodeProps {
  node: TreeNodeType;
  isLast?: boolean;
}

export function TreeNode({ node, isLast = false }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative pl-8">
      {/* Vertical line from parent */}
      <div
        className={`absolute left-0 top-0 h-full w-px bg-border ${
          isLast ? 'h-7' : ''
        }`}
      ></div>
      {/* Horizontal line to node */}
      <div className="absolute left-0 top-7 h-px w-8 bg-border"></div>

      <div className="relative mb-4 flex items-center space-x-3 rounded-md border bg-card p-4 shadow-sm">
        {hasChildren ? (
          <Users className="h-6 w-6 text-primary" />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="font-medium text-lg">{node.name}</span>
      </div>

      {hasChildren && (
        <div className="space-y-4">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              isLast={index === node.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
