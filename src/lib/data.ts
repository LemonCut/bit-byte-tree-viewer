import type { Connection, TreeNode, SearchResult } from '@/lib/types';

// This file is now primarily for the data transformation logic.
// The data itself will be managed in the component's state.

export function getTrees(connections: Connection[]): { allTrees: string[] } {
  const treeNames = new Set<string>();
  let hasUnassigned = false;
  connections.forEach((c) => {
    if (c.treeName) {
        treeNames.add(c.treeName);
    } else {
        hasUnassigned = true;
    }
  });

  const sortedTrees = Array.from(treeNames).sort();
  if (hasUnassigned) {
      sortedTrees.push('(None)');
  }
  
  return {
    allTrees: sortedTrees,
  };
}

export function getAllPeople(connections: Connection[]): string[] {
  const people = new Set<string>();
  connections.forEach((c) => {
    people.add(c.byte);
    people.add(c.bit);
  });
  return Array.from(people).sort();
}

export function getBytes(connections: Connection[]): string[] {
  const bytes = new Set<string>();
  connections.forEach((c) => {
    bytes.add(c.byte);
  });
  return Array.from(bytes).sort();
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
    (c) => (c.treeName || '(None)') === treeName
  );
  if (relevantConnections.length === 0) return [];

  const nodes: { [key: string]: TreeNode } = {};
  const bits = new Set<string>();

  // Initialize all nodes and track who is a bit
  relevantConnections.forEach(({ byte, bit, year }) => {
    const byteId = byte.replace(/\s+/g, '_');
    const bitId = bit.replace(/\s+/g, '_');
    
    bits.add(byte); // Any 'byte' is a parent, so we use their name to check for roots later.
    if (!nodes[byteId]) {
      nodes[byteId] = { id: byteId, name: byte, children: [] };
    }
    if (!nodes[bitId]) {
      // Assign the year to the bit when it's created
      nodes[bitId] = { id: bitId, name: bit, year: year, children: [] };
    } else if (!nodes[bitId].year) {
      // If the bit node was already created (e.g. as a byte in another connection)
      // assign the year. This takes the year from its first appearance as a 'bit'.
      nodes[bitId].year = year;
    }
  });

  // Populate children
  relevantConnections.forEach(({ byte, bit }) => {
    const byteId = byte.replace(/\s+/g, '_');
    const bitId = bit.replace(/\s+/g, '_');
    // Ensure parent exists before trying to push child
    if (nodes[byteId] && nodes[bitId]) {
       // Avoid adding duplicates
      if (!nodes[byteId].children.some(child => child.id === nodes[bitId].id)) {
        nodes[byteId].children.push(nodes[bitId]);
      }
    }
  });
  
  // Find root nodes (bytes who are never bits in THIS tree)
  const bitsInThisTree = new Set(relevantConnections.map(c => c.bit));
  const rootNodes = Object.values(nodes).filter(
    (node) => !bitsInThisTree.has(node.name)
  );

  return rootNodes;
}


function generateTooltip(person: SearchResult): string {
    const name = person.name;
    const treeInfo = person.connections.map(conn => {
        if (conn.isRoot) {
            return `${conn.treeName} (Root)`;
        }
        return `${conn.treeName} (${conn.year} - ${conn.byte}'s Bit)`;
    }).join('\n');
    return `${name}\nTree(s):\n${treeInfo}`;
}


export function searchPeople(connections: Connection[], query: string): SearchResult[] {
  if (!query) return [];

  const lowerCaseQuery = query.toLowerCase();
  const people = new Map<string, SearchResult>();

  connections.forEach(({ id, bit, byte, treeName, year }) => {
    const bitId = bit.replace(/\s+/g, '_');
    const byteId = byte.replace(/\s+/g, '_');
    const currentTreeName = treeName || '(None)';
    
    // Check bit
    if (bit.toLowerCase().includes(lowerCaseQuery)) {
      if (!people.has(bit)) {
        people.set(bit, {
          name: bit,
          id: bitId,
          connections: [],
          tooltip: ''
        });
      }
      people.get(bit)!.connections.push({
        treeName: currentTreeName,
        year: year,
        byte: byte,
        isRoot: false,
        id: id
      });
    }

    // Check byte
    if (byte.toLowerCase().includes(lowerCaseQuery)) {
      const isRoot = !connections.some(c => c.bit === byte && (c.treeName || '(None)') === currentTreeName);

      if (!people.has(byte)) {
        people.set(byte, {
          name: byte,
          id: byteId,
          connections: [],
          tooltip: ''
        });
      }
      
      const existingConnection = people.get(byte)!.connections.find(c => c.treeName === currentTreeName);
      if (!existingConnection) {
         // Find if this byte is a bit in the same tree to avoid duplicate entries
        const isAlsoBitInSameTree = connections.some(c => c.bit === byte && (c.treeName || '(None)') === currentTreeName);
        if (!isAlsoBitInSameTree) {
            people.get(byte)!.connections.push({
                treeName: currentTreeName,
                isRoot: isRoot,
                byte: null,
                year: null,
                id: id
            });
        }
      } else if (existingConnection.isRoot === false && isRoot) {
          // If we have a non-root entry but determine it's a root, update it.
          // This case is unlikely if data is processed linearly but good for safety.
          existingConnection.isRoot = true;
          existingConnection.byte = null;
          existingConnection.year = null;
      }
    }
  });

  const results = Array.from(people.values()).sort((a, b) => a.name.localeCompare(b.name));
  
  // Generate tooltip after all connections are gathered
  results.forEach(person => {
      person.tooltip = generateTooltip(person);
  });
  
  return results;
}

    