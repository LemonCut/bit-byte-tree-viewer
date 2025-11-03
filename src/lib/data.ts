
import type { Connection, TreeNode, SearchResult, TreeAKA, Person } from '@/lib/types';

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

export function getAllPeople(connections: Connection[]): Person[] {
  const peopleMap = new Map<string, Person>();
  connections.forEach((c) => {
    if (!peopleMap.has(c.bitId)) {
        peopleMap.set(c.bitId, { id: c.bitId, name: c.bitName });
    }
     if (!peopleMap.has(c.byteId)) {
        peopleMap.set(c.byteId, { id: c.byteId, name: c.byteName });
    }
  });
  return Array.from(peopleMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getBytes(connections: Connection[]): Person[] {
  const bytesMap = new Map<string, Person>();
  connections.forEach((c) => {
    if (!bytesMap.has(c.byteId)) {
      bytesMap.set(c.byteId, { id: c.byteId, name: c.byteName });
    }
  });
  return Array.from(bytesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}


export function getBits(connections: Connection[]): Person[] {
  const bitsMap = new Map<string, Person>();
  connections.forEach((c) => {
     if (!bitsMap.has(c.bitId)) {
      bitsMap.set(c.bitId, { id: c.bitId, name: c.bitName });
    }
  });
  return Array.from(bitsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function findBitInOtherTrees(connections: Connection[], bitId: string, currentTree: string): string | null {
  const connection = connections.find(c => c.bitId === bitId && c.treeName !== currentTree);
  return connection ? connection.treeName : null;
}

export function buildTree(
  connections: Connection[],
  treeName: string
): TreeNode[] {
  // Do not perform merge logic for the '(None)' tree
  if (treeName === '(None)') {
     const treeConnections = connections.filter(c => (c.treeName || '(None)') === '(None)');
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
    const bitsInTree = new Set(treeConnections.map(c => c.bitId));

    treeConnections.forEach(({ byteId, byteName, bitId, bitName, year }) => {
      
      if (!allNodes[byteId]) {
        allNodes[byteId] = { id: byteId, name: byteName, children: [] };
      }
      if (!allNodes[bitId]) {
        allNodes[bitId] = { id: bitId, name: bitName, year, children: [] };
      } else if (allNodes[bitId].year === undefined) {
        allNodes[bitId].year = year;
      }
      
      // Link child to parent
      if (!allNodes[byteId].children.some(child => child.id === bitId)) {
        allNodes[byteId].children.push(allNodes[bitId]);
      }
      
      // Identify and tag root of the *current* tree
      if (!bitsInTree.has(byteId)) {
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
  const allBitIdsInMergedTree = new Set<string>();
  treeNamesToBuild.forEach(name => {
    connections.filter(c => (c.treeName || '(None)') === name)
               .forEach(c => allBitIdsInMergedTree.add(c.bitId));
  });

  const finalRootNodes = Object.values(allNodes).filter(
    (node) => !allBitIdsInMergedTree.has(node.id)
  );

  return finalRootNodes;
}

// Helper to build a single, non-merged tree. Used for '(None)'
function buildSingleTree(treeConnections: Connection[], treeName: string): TreeNode[] {
    const nodes: { [key: string]: TreeNode } = {};
    const bitsInTree = new Set(treeConnections.map(c => c.bitId));

    treeConnections.forEach(({ byteId, byteName, bitId, bitName, year }) => {
        if (!nodes[byteId]) {
            nodes[byteId] = { id: byteId, name: byteName, children: [] };
        }
        if (!nodes[bitId]) {
            nodes[bitId] = { id: bitId, name: bitName, year, children: [] };
        } else if (nodes[bitId].year === undefined) {
            nodes[bitId].year = year;
        }
        
        if (!nodes[byteId].children.some(child => child.id === bitId)) {
            nodes[byteId].children.push(nodes[bitId]);
        }
        
        if (!bitsInTree.has(byteId)) {
            nodes[byteId].rootOfTreeName = treeName;
        }
    });

    return Object.values(nodes).filter(node => !bitsInTree.has(node.id));
}


function generateTooltip(person: SearchResult): string {
    const name = `${person.name} (ID: ${person.id})`;
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

  connections.forEach(({ id: connectionId, bitId, bitName, byteId, byteName, treeName, year }) => {
    const currentTreeName = treeName || '(None)';
    
    // Function to initialize a person in the map if they don't exist
    const ensurePerson = (personId: string, personName: string) => {
        if (!people.has(personId)) {
            people.set(personId, {
                id: personId,
                name: personName,
                connections: [],
                tooltip: ''
            });
        }
    };

    // Check if query matches name or ID
    const bitMatches = bitName.toLowerCase().includes(lowerCaseQuery) || bitId.includes(lowerCaseQuery);
    const byteMatches = byteName.toLowerCase().includes(lowerCaseQuery) || byteId.includes(lowerCaseQuery);

    if (bitMatches) {
        ensurePerson(bitId, bitName);
        people.get(bitId)!.connections.push({
            treeName: currentTreeName,
            year: year,
            isBit: true,
            isByte: false,
            otherPersonName: byteName,
            isRoot: false, // A bit is never a root in its own connection
            connectionId: connectionId,
        });
    }

    if (byteMatches) {
        ensurePerson(byteId, byteName);
        const isRoot = !connections.some(c => c.bitId === byteId && (c.treeName || '(None)') === currentTreeName);
        
        // Avoid adding a duplicate connection entry if the person is both a byte and bit in different contexts
        const existingConnections = people.get(byteId)!.connections;
        const connectionExists = existingConnections.some(c => c.connectionId === connectionId);

        if (!connectionExists) {
             people.get(byteId)!.connections.push({
                treeName: currentTreeName,
                year: null,
                isBit: false,
                isByte: true,
                otherPersonName: bitName,
                isRoot: isRoot,
                connectionId: connectionId,
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
  const allTrees = Array.from(new Set(connections.map(c => c.treeName || '(None)')));

  allTrees.forEach(treeName => {
    // Ignore '(None)' tree in this logic
    if (treeName === '(None)') {
        return;
    }
    
    // Find root bytes for the current tree
    const connectionsInTree = connections.filter(c => (c.treeName || '(None)') === treeName);
    const bitIdsInTree = new Set(connectionsInTree.map(c => c.bitId));
    const rootBytesInTree = connectionsInTree.filter(c => !bitIdsInTree.has(c.byteId));

    // For each root byte, see if they were a bit in another tree
    rootBytesInTree.forEach(rootByteConnection => {
      const connectionAsBit = connections.find(c => c.bitId === rootByteConnection.byteId);

      if (connectionAsBit) {
        const originalTree = connectionAsBit.treeName || '(None)';
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
