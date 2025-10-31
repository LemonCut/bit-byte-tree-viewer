import type { Connection, TreeNode } from '@/lib/types';

// This file is now primarily for the data transformation logic.
// The data itself will be managed in the component's state.

export function getTrees(connections: Connection[]): string[] {
  const treeNames = new Set(connections.map((c) => c.treeName));
  return Array.from(treeNames);
}

export function getPeople(connections: Connection[]): string[] {
  const people = new Set<string>();
  connections.forEach((c) => {
    people.add(c.byte);
    people.add(c.bit);
  });
  return Array.from(people).sort();
}

export function buildTree(
  connections: Connection[],
  treeName: string
): TreeNode[] {
  const relevantConnections = connections.filter(
    (c) => c.treeName === treeName
  );
  if (relevantConnections.length === 0) return [];

  const nodes: { [key: string]: TreeNode } = {};
  const bits = new Set<string>();

  // Initialize all nodes and track who is a bit
  relevantConnections.forEach(({ byte, bit }) => {
    bits.add(bit);
    if (!nodes[byte]) {
      nodes[byte] = { id: byte, name: byte, children: [] };
    }
    if (!nodes[bit]) {
      nodes[bit] = { id: bit, name: bit, children: [] };
    }
  });

  // Populate children
  relevantConnections.forEach(({ byte, bit }) => {
    // Ensure parent exists before trying to push child
    if (nodes[byte]) {
      nodes[byte].children.push(nodes[bit]);
    }
  });

  // Find root nodes (those who are not bits in this tree)
  const rootNodes = Object.values(nodes).filter(
    (node) => !bits.has(node.name)
  );

  return rootNodes;
}
