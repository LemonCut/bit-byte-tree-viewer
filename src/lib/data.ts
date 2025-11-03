
import type { Connection, TreeNode, SearchResult, TreeAKA, Person } from '@/lib/types';
import { collection, query, where, getDocs, writeBatch, type Firestore } from 'firebase/firestore';

// This file is now primarily for the data transformation logic.
// The data itself will be managed in the component's state.

export function getTrees(connections: Connection[], treeAKAs: TreeAKA = {}): { allTrees: string[] } {
  const treeNames = new Set<string>();
  connections.forEach((c) => {
    const treeName = c.tree || '(None)';
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

export function getAllPeople(connections: Connection[]): Person[] {
  const peopleNames = new Set<string>();
  connections.forEach((c) => {
    peopleNames.add(c.bit);
    peopleNames.add(c.byte);
  });
  return Array.from(peopleNames).sort().map(name => ({ name }));
}

export function getBytes(connections: Connection[]): Person[] {
  const bytes = new Set<string>();
  connections.forEach((c) => {
    bytes.add(c.byte);
  });
  return Array.from(bytes).sort().map(name => ({ name }));
}


export function getBits(connections: Connection[]): Person[] {
  const bits = new Set<string>();
  connections.forEach((c) => {
    bits.add(c.bit);
  });
  return Array.from(bits).sort().map(name => ({ name }));
}

export function findBitInOtherTrees(connections: Connection[], bit: string, currentTree: string): string | null {
  const connection = connections.find(c => c.bit === bit && c.tree !== currentTree);
  return connection ? connection.tree : null;
}

export function buildTree(
  connections: Connection[],
  treeName: string
): TreeNode[] {
  // Do not perform merge logic for the '(None)' tree
  if (treeName === '(None)') {
     const treeConnections = connections.filter(c => (c.tree || '(None)') === '(None)');
     return buildSingleTree(treeConnections, '(None)');
  }
  
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
      
      if (!allNodes[byte]) {
        allNodes[byte] = { id: byte, name: byte, children: [] };
      }
      if (!allNodes[bit]) {
        allNodes[bit] = { id: bit, name: bit, year, children: [] };
      } else if (allNodes[bit].year === undefined) {
        allNodes[bit].year = year;
      }
      
      // Link child to parent
      if (!allNodes[byte].children.some(child => child.id === bit)) {
        allNodes[byte].children.push(allNodes[bit]);
      }
      
      // Identify and tag root of the *current* tree
      if (!bitsInTree.has(byte)) {
        allNodes[byte].rootOfTreeName = currentTreeName;
      }
    });
  };

  // Process connections for each relevant tree
  treeNamesToBuild.forEach(name => {
    const relevantConnections = connections.filter(c => (c.tree || '(None)') === name);
    processTreeConnections(relevantConnections, name);
  });

  if (Object.keys(allNodes).length === 0) return [];

  // Determine the final root nodes for the entire merged structure
  const allBitNamesInMergedTree = new Set<string>();
  treeNamesToBuild.forEach(name => {
    connections.filter(c => (c.tree || '(None)') === name)
               .forEach(c => allBitNamesInMergedTree.add(c.bit));
  });

  const finalRootNodes = Object.values(allNodes).filter(
    (node) => !allBitNamesInMergedTree.has(node.name)
  );

  return finalRootNodes;
}

// Helper to build a single, non-merged tree. Used for '(None)'
function buildSingleTree(treeConnections: Connection[], treeName: string): TreeNode[] {
    const nodes: { [key: string]: TreeNode } = {};
    const bitsInTree = new Set(treeConnections.map(c => c.bit));

    treeConnections.forEach(({ byte, bit, year }) => {
        if (!nodes[byte]) {
            nodes[byte] = { id: byte, name: byte, children: [] };
        }
        if (!nodes[bit]) {
            nodes[bit] = { id: bit, name: bit, year, children: [] };
        } else if (nodes[bit].year === undefined) {
            nodes[bit].year = year;
        }
        
        if (!nodes[byte].children.some(child => child.id === bit)) {
            nodes[byte].children.push(nodes[bit]);
        }
        
        if (!bitsInTree.has(byte)) {
            nodes[byte].rootOfTreeName = treeName;
        }
    });

    return Object.values(nodes).filter(node => !bitsInTree.has(node.name));
}


function generateTooltip(person: SearchResult): string {
    const name = person.name;
    const treeInfo = person.connections.map(conn => {
        if (conn.isRoot) {
            return `${conn.treeName} (Root)`;
        }
        const role = conn.isBit ? 'Bit' : 'Byte';
        const otherPerson = conn.otherPersonName;
        if (role === 'Bit') {
            return `${conn.treeName} (${conn.year} - ${otherPerson}'s Bit)`;
        }
        return `${conn.treeName} (Bit to ${otherPerson})`;
    }).join('\n');

    return `${name}\nTree(s):\n${treeInfo}`;
}


export function searchPeople(connections: Connection[], query: string): SearchResult[] {
  if (!query) return [];

  const lowerCaseQuery = query.toLowerCase();
  const people = new Map<string, SearchResult>();

  connections.forEach(({ bit, byte, tree, year }) => {
    const currentTreeName = tree || '(None)';
    
    // Function to initialize a person in the map if they don't exist
    const ensurePerson = (name: string) => {
        if (!people.has(name)) {
            people.set(name, {
                name: name,
                connections: [],
                tooltip: ''
            });
        }
    };

    if (bit.toLowerCase().includes(lowerCaseQuery)) {
      ensurePerson(bit);
      people.get(bit)!.connections.push({
        treeName: currentTreeName,
        year: year,
        isBit: true,
        isByte: false,
        otherPersonName: byte,
        isRoot: false, // A bit is never a root in its own connection
      });
    }

    if (byte.toLowerCase().includes(lowerCaseQuery)) {
      ensurePerson(byte);
      const isRoot = !connections.some(c => c.bit === byte && (c.tree || '(None)') === currentTreeName);
      
      // A person can be a byte to multiple bits in the same tree. Avoid adding duplicate 'byte' entries.
      const existingByteEntry = people.get(byte)!.connections.find(c => c.treeName === currentTreeName && c.isByte);
      if (!existingByteEntry) {
          people.get(byte)!.connections.push({
            treeName: currentTreeName,
            year: null,
            isBit: false,
            isByte: true,
            otherPersonName: null,
            isRoot: isRoot,
          });
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
  const allTrees = Array.from(new Set(connections.map(c => c.tree || '(None)')));

  allTrees.forEach(treeName => {
    // Ignore '(None)' tree in this logic
    if (treeName === '(None)') {
        return;
    }
    
    // Find root bytes for the current tree
    const connectionsInTree = connections.filter(c => (c.tree || '(None)') === treeName);
    const bitNamesInTree = new Set(connectionsInTree.map(c => c.bit));
    const rootBytesInTree = connectionsInTree.filter(c => !bitNamesInTree.has(c.byte));

    // For each root byte, see if they were a bit in another tree
    rootBytesInTree.forEach(rootByteConnection => {
      const connectionAsBit = connections.find(c => c.bit === rootByteConnection.byte);

      if (connectionAsBit) {
        const originalTree = connectionAsBit.tree || '(None)';
        // Also ignore linking to/from the '(None)' tree
        if (originalTree !== treeName && originalTree !== '(None)') {
            // Found a link: originalTree is AKA the current treeName
            // We store it so we can look up the "new" name from the "old" one.
            treeAKAs[originalTree] = treeName;
        }
      }
    });
  });

  return treeAKAs;
}

export const generateId = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function updatePersonNameInConnections(firestore: Firestore, batch: any, oldName: string, newName: string) {
  const connectionsCollection = collection(firestore, 'connections');

  // Find all connections where the person is a 'bit'
  const bitQuery = query(connectionsCollection, where("bit", "==", oldName));
  const bitQuerySnapshot = await getDocs(bitQuery);
  bitQuerySnapshot.forEach(doc => {
    batch.update(doc.ref, { bit: newName });
  });

  // Find all connections where the person is a 'byte'
  const byteQuery = query(connectionsCollection, where("byte", "==", oldName));
  const byteQuerySnapshot = await getDocs(byteQuery);
  byteQuerySnapshot.forEach(doc => {
    batch.update(doc.ref, { byte: newName });
  });
}
