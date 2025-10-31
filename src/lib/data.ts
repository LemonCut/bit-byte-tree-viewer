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
    people.add(c.big);
    people.add(c.little);
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
  const littles = new Set<string>();

  // Initialize all nodes and track who is a little
  relevantConnections.forEach(({ big, little }) => {
    littles.add(little);
    if (!nodes[big]) {
      nodes[big] = { id: big, name: big, children: [] };
    }
    if (!nodes[little]) {
      nodes[little] = { id: little, name: little, children: [] };
    }
  });

  // Populate children
  relevantConnections.forEach(({ big, little }) => {
    // Ensure parent exists before trying to push child
    if (nodes[big]) {
      nodes[big].children.push(nodes[little]);
    }
  });

  // Find root nodes (those who are not littles in this tree)
  const rootNodes = Object.values(nodes).filter(
    (node) => !littles.has(node.name)
  );

  return rootNodes;
}
