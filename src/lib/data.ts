
import type { Connection, TreeNode, SearchResult, TreeAKA } from '@/lib/types';

// This file is now primarily for the data transformation logic.
// The data itself will be managed in the component's state.

export function getTrees(connections: Connection[], treeAKAs: TreeAKA = {}): { allTrees: string[] } {
  const treeNames = new Set<string>();
  connections.forEach((c) => {
    const treeName = c.treeName || '(None)';
    treeNames.add(treeName);
  });
  
  // Filter out the old tree names that have been renamed
  const oldTreeNames = Object.keys(treeAKAs);
  oldTreeNames.forEach(oldName => treeNames.delete(oldName));

  const sortedTrees = Array.from(treeNames).sort();

  // Ensure '(None)' is at the bottom if it exists
  if (sortedTrees.includes('(None)')) {
    return {
      allTrees: [...sortedTrees.filter(t => t !== '(None)'), '(None)'],
    };
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
  const treeAKAs = findTreeAKAs(connections);
  const originalName = Object.keys(treeAKAs).find(key => treeAKAs[key] === treeName);

  const treeNamesToBuild = [treeName];
  if (originalName) {
    treeNamesToBuild.push(originalName);
  }

  const allNodes: { [key: string]: TreeNode } = {};

  // Helper function to process connections for a single tree
  const processTreeConnections = (
    treeConnections: Connection[],
    currentTreeName: string
  ) => {
    const bitsInTree = new Set(treeConnections.map(c => c.bit));

    treeConnections.forEach(({ byte, bit, year }) => {
      const byteId = byte.replace(/\s+/g, '_');
      const bitId = bit.replace(/\s+/g, '_');

      if (!allNodes[byteId]) {
        allNodes[byteId] = { id: byteId, name: byte, children: [] };
      }
      if (!allNodes[bitId]) {
        allNodes[bitId] = { id: bitId, name: bit, year, children: [] };
      } else if (allNodes[bitId].year === undefined) {
        allNodes[bitId].year = year;
      }
      
      // Link child to parent
      if (!allNodes[byteId].children.some(child => child.id === bitId)) {
        allNodes[byteId].children.push(allNodes[bitId]);
      }
      
      // Identify and tag root of the *current* tree
      if (!bitsInTree.has(byte)) {
        allNodes[byteId].rootOfTreeName = currentTreeName;
      }
    });
  };

  // Process connections for each relevant tree
  treeNamesToBuild.forEach(name => {
    const relevantConnections = connections.filter(c => (c.treeName || '(None)') === name);
    processTreeConnections(relevantConnections, name);
  });

  if (Object.keys(allNodes).length === 0) return [];

  // Determine the final root nodes for the entire merged structure
  const allBitsInMergedTree = new Set<string>();
  treeNamesToBuild.forEach(name => {
    connections.filter(c => (c.treeName || '(None)') === name)
               .forEach(c => allBitsInMergedTree.add(c.bit));
  });

  const finalRootNodes = Object.values(allNodes).filter(
    (node) => !allBitsInMergedTree.has(node.name)
  );

  return finalRootNodes;
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

export function findTreeAKAs(connections: Connection[]): TreeAKA {
  if (!connections || connections.length === 0) return {};

  const treeAKAs: TreeAKA = {};
  const allTrees = Array.from(new Set(connections.map(c => c.treeName || '(None)')));

  allTrees.forEach(treeName => {
    // Find root bytes for the current tree
    const connectionsInTree = connections.filter(c => (c.treeName || '(None)') === treeName);
    const bitsInTree = new Set(connectionsInTree.map(c => c.bit));
    const rootBytesInTree = new Set(
      connectionsInTree.filter(c => !bitsInTree.has(c.byte)).map(c => c.byte)
    );

    // For each root byte, see if they were a bit in another tree
    rootBytesInTree.forEach(rootByte => {
      const connectionAsBit = connections.find(c => c.bit === rootByte);

      if (connectionAsBit) {
        const originalTree = connectionAsBit.treeName || '(None)';
        if (originalTree !== treeName) {
            // Found a link: originalTree is AKA the current treeName
            // We store it so we can look up the "new" name from the "old" one.
            treeAKAs[originalTree] = treeName;
        }
      }
    });
  });

  return treeAKAs;
}
