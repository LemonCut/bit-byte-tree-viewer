import type { Connection, TreeNode } from '@/lib/types';

// This file is now primarily for the data transformation logic.
// The data itself will be managed in the component's state.

export function getTrees(connections: Connection[]): string[] {
  const treeNames = new Set(connections.map((c) => c.treeName));
  return Array.from(treeNames);
}

export function getAllPeople(connections: Connection[]): string[] {
  const people = new Set<string>();
  connections.forEach((c) => {
    people.add(c.byte);
    people.add(c.bit);
  });
  return Array.from(people).sort();
}

export function getBits(connections: Connection[]): string[] {
  const bits = new Set<string>();
  connections.forEach((c) => {
    bits.add(c.bit);
  });
  return Array.from(bits).sort();
}

export function findBitInOtherTrees(connections: Connection[], bitName: string, currentTree: string): string | null {
  const connection = connections.find(c => c.bit === bitName && c.treeName !== currentTree);
  return connection ? connection.treeName : null;
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
  relevantConnections.forEach(({ byte, bit, year }) => {
    bits.add(bit);
    if (!nodes[byte]) {
      nodes[byte] = { id: byte, name: byte, children: [] };
    }
    if (!nodes[bit]) {
      // Assign the year to the bit when it's created
      nodes[bit] = { id: bit, name: bit, year: year, children: [] };
    } else if (!nodes[bit].year) {
      // If the bit node was already created (e.g. as a byte in another connection)
      // assign the year. This takes the year from its first appearance as a 'bit'.
      nodes[bit].year = year;
    }
  });

  // Populate children
  relevantConnections.forEach(({ byte, bit }) => {
    // Ensure parent exists before trying to push child
    if (nodes[byte] && nodes[bit]) {
       // Avoid adding duplicates
      if (!nodes[byte].children.some(child => child.id === nodes[bit].id)) {
        nodes[byte].children.push(nodes[bit]);
      }
    }
  });

  // Find root nodes (those who are not bits in this tree)
  const rootNodes = Object.values(nodes).filter(
    (node) => !bits.has(node.name)
  );

  return rootNodes;
}