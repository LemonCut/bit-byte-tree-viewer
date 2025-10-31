import type { Connection, TreeNode } from '@/lib/types';

// Mock data mimicking a database table
export const connections: Connection[] = [
  { big: 'Alpha', little: 'Beta', treeName: 'Tech Innovators', year: 2020 },
  { big: 'Alpha', little: 'Gamma', treeName: 'Tech Innovators', year: 2020 },
  { big: 'Beta', little: 'Delta', treeName: 'Tech Innovators', year: 2021 },
  { big: 'Gamma', little: 'Epsilon', treeName: 'Tech Innovators', year: 2021 },
  { big: 'Delta', little: 'Zeta', treeName: 'Tech Innovators', year: 2022 },
  { big: 'Epsilon', little: 'Eta', treeName: 'Tech Innovators', year: 2022 },
  { big: 'Zeta', little: 'Theta', treeName: 'Tech Innovators', year: 2023 },

  { big: 'Zeus', little: 'Apollo', treeName: 'Olympus', year: 1 },
  { big: 'Zeus', little: 'Artemis', treeName: 'Olympus', year: 1 },
  { big: 'Apollo', little: 'Hermes', treeName: 'Olympus', year: 2 },
  { big: 'Artemis', little: 'Dionysus', treeName: 'Olympus', year: 2 },

  { big: 'Genesis', little: 'Exodus', treeName: 'Old Testament', year: 100 },
  { big: 'Genesis', little: 'Leviticus', treeName: 'Old Testament', year: 100 },
];

export function getTrees() {
  const treeNames = new Set(connections.map((c) => c.treeName));
  return Array.from(treeNames);
}

export function getPeople() {
  const people = new Set<string>();
  connections.forEach((c) => {
    people.add(c.big);
    people.add(c.little);
  });
  return Array.from(people).sort();
}

export function buildTree(treeName: string): TreeNode[] {
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
    nodes[big].children.push(nodes[little]);
  });

  // Find root nodes (those who are not littles in this tree)
  const rootNodes = Object.values(nodes).filter((node) => !littles.has(node.name));

  return rootNodes;
}
