
import type { Connection, TreeNode, SearchResult, TreeAKA, Person } from '@/lib/types';

// This file is now primarily for the data transformation logic.
// The data itself will be read from a local CSV file.

export function getTrees(connections: Connection[], saplingThreshold: number = 4, treeAKAs: TreeAKA = {}, isAdmin: boolean = false): { allTrees: string[], saplings: string[] } {
  const treeNames = new Set<string>();
  connections.forEach((c) => {
    const treeName = c.tree || '(None)';
    treeNames.add(treeName);
  });
  
  if (!isAdmin) {
    // This logic ensures we only show the *final* canonical tree name.
    // If a tree name is listed as an "old" name (a key in treeAKAs)
    // but is NOT the "new" name for any other tree (not a value in treeAKAs),
    // then it is considered obsolete and should be removed.
    const oldTreeNames = Object.keys(treeAKAs);
    const canonicalTreeNames = new Set(Object.values(treeAKAs));
    oldTreeNames.forEach(oldName => {
      if (!canonicalTreeNames.has(oldName)) {
        treeNames.delete(oldName);
      }
    });
  }

  const allTreesList = Array.from(treeNames);
  const mainTrees: string[] = [];
  const saplings: string[] = [];

  allTreesList.forEach(treeName => {
    if (treeName === '(None)') return;

    const peopleInTree = new Set<string>();
    connections.forEach(c => {
      if (c.tree === treeName) {
        peopleInTree.add(c.bit);
        peopleInTree.add(c.byte);
      }
    });

    if (peopleInTree.size <= saplingThreshold) {
      saplings.push(treeName);
    } else {
      mainTrees.push(treeName);
    }
  });

  mainTrees.sort();
  saplings.sort();
  
  return {
    allTrees: mainTrees,
    saplings: saplings,
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
  // Find all tree names that are equivalent to the selected treeName
  const equivalentTreeNames = new Set([treeName]);
  for (const aka in treeAKAs) {
    if (treeAKAs[aka] === treeName) {
      equivalentTreeNames.add(aka);
    }
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

  // Process connections for each equivalent tree name
  equivalentTreeNames.forEach(name => {
    const relevantConnections = connections.filter(c => (c.tree || '(None)') === name);
    processTreeConnections(relevantConnections, name);
  });


  if (Object.keys(allNodes).length === 0) return [];

  // Determine the final root nodes for the entire merged structure
  const allBitNamesInMergedTree = new Set<string>();
  
  connections
    .filter(c => equivalentTreeNames.has(c.tree || '(None)'))
    .forEach(c => allBitNamesInMergedTree.add(c.bit));


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
        // It's a bit connection
        return `${conn.treeName} (${conn.year} - ${conn.otherPersonName}'s Bit)`;

    }).join('\n');

    let finalTooltip = name;
    if (treeInfo) {
      finalTooltip += `\nTree(s):\n${treeInfo}`;
    }
    return finalTooltip;
}


export function searchPeople(connections: Connection[], query: string): SearchResult[] {
  if (!query) return [];

  const lowerCaseQuery = query.toLowerCase();
  const people = new Map<string, SearchResult>();

  // Function to initialize a person in the map if they don't exist
  const ensurePerson = (name: string) => {
    if (!people.has(name)) {
      people.set(name, {
        name: name,
        connections: [],
        tooltip: ''
      });
    }
    return people.get(name)!;
  };
  
  // Find all people whose names match the query
  const allPeopleNames = new Set(connections.flatMap(c => [c.bit, c.byte]));
  const matchedNames = Array.from(allPeopleNames).filter(name => name.toLowerCase().includes(lowerCaseQuery));

  // For each matched person, find all their connections
  matchedNames.forEach(name => {
      const personResult = ensurePerson(name);

      // Find connections where this person is a BIT (a child)
      connections.forEach(({ bit, byte, tree, year }) => {
          if (bit === name) {
              personResult.connections.push({
                  treeName: tree || '(None)',
                  year: year,
                  isBit: true,
                  isByte: false,
                  otherPersonName: byte,
                  isRoot: false,
              });
          }
      });
      
      // Find connections where this person is a BYTE (a parent)
      // And determine if they are a root in any tree
      const asByteInTrees = new Set<string>();
      connections.forEach(({ byte, tree }) => {
          if (byte === name) {
              asByteInTrees.add(tree || '(None)');
          }
      });

      asByteInTrees.forEach(treeName => {
        const isRoot = !connections.some(c => c.bit === name && (c.tree || '(None)') === treeName);
        if (isRoot) {
           // Check if this root connection is already represented by a bit connection
            const alreadyHasConnection = personResult.connections.some(c => c.treeName === treeName);
            if (!alreadyHasConnection) {
                 personResult.connections.push({
                    treeName: treeName,
                    year: null,
                    isBit: false,
                    isByte: true,
                    otherPersonName: null,
                    isRoot: true,
                });
            }
        }
      });
  });

  const results = Array.from(people.values()).sort((a, b) => a.name.localeCompare(b.name));
  
  // Generate tooltip after all connections are gathered
  results.forEach(person => {
    person.tooltip = generateTooltip(person);
  });
  
  return results.filter(p => p.connections.length > 0);
}

export function findTreeAKAs(connections: Connection[]): TreeAKA {
  if (!connections || connections.length === 0) return {};

  const treeLinks: { [key: string]: string } = {};
  const allTrees = Array.from(new Set(connections.map(c => c.tree || '(None)')));

  allTrees.forEach(treeName => {
    if (treeName === '(None)') return;

    const connectionsInTree = connections.filter(c => (c.tree || '(None)') === treeName);
    const bitNamesInTree = new Set(connectionsInTree.map(c => c.bit));
    const rootBytesInTree = connectionsInTree.filter(c => !bitNamesInTree.has(c.byte));

    rootBytesInTree.forEach(rootByteConnection => {
      const connectionAsBit = connections.find(c => c.bit === rootByteConnection.byte);
      if (connectionAsBit) {
        const originalTree = connectionAsBit.tree || '(None)';
        if (originalTree !== treeName && originalTree !== '(None)') {
          // Here, 'treeName' is the newer name, 'originalTree' is the older one.
          // The link should point from old to new.
          treeLinks[originalTree] = treeName;
        }
      }
    });
  });

  const treeAKAs: TreeAKA = {};
  const allOriginals = Array.from(new Set([...Object.keys(treeLinks), ...Object.values(treeLinks)]));

  // For each tree name, trace its chain to find the final canonical name
  allOriginals.forEach(startName => {
    let currentName = startName;
    const visited = new Set([currentName]);

    // Keep following the links until we find a name that is not an original name itself
    while (treeLinks[currentName]) {
      currentName = treeLinks[currentName];
      // Circular dependency detected, break to avoid infinite loop
      if (visited.has(currentName)) {
        break; 
      }
      visited.add(currentName);
    }
    // Map the starting name to the final canonical name found
    treeAKAs[startName] = currentName;
  });

  return treeAKAs;
}

export function findDisconnectedTrees(connections: Connection[]): string[] {
  if (!connections || connections.length === 0) {
    return [];
  }

  const allBitsGlobally = new Set(connections.map(c => c.bit));
  const treeAKAs = findTreeAKAs(connections);

  const canonicalTrees: { [key: string]: string[] } = {};
  for (const treeName in treeAKAs) {
    const canonicalName = treeAKAs[treeName];
    if (!canonicalTrees[canonicalName]) {
      canonicalTrees[canonicalName] = [];
    }
    canonicalTrees[canonicalName].push(treeName);
  }

  const disconnectedTreeNames = new Set<string>();

  const allTreeNames = Array.from(new Set(connections.map(c => c.tree).filter(Boolean))) as string[];

  for (const treeName of allTreeNames) {
    const canonicalName = treeAKAs[treeName] || treeName;
    
    // Find all tree names that are part of this canonical group
    const equivalentTreeNames = new Set([canonicalName]);
    for (const aka in treeAKAs) {
      if (treeAKAs[aka] === canonicalName) {
        equivalentTreeNames.add(aka);
      }
    }
    
    const mergedTreeConnections = connections.filter(c => equivalentTreeNames.has(c.tree || '(None)'));
    const bitsInMergedTree = new Set(mergedTreeConnections.map(c => c.bit));
    
    const rootsOfMergedTree = new Set<string>();
    mergedTreeConnections.forEach(c => {
      if (!bitsInMergedTree.has(c.byte)) {
        rootsOfMergedTree.add(c.byte);
      }
    });

    // A merged tree is disconnected if it has more than one "true" root.
    // A "true" root is a root of the merged tree that is NOT a bit anywhere else.
    let trueRootCount = 0;
    rootsOfMergedTree.forEach(root => {
      if (!allBitsGlobally.has(root)) {
        trueRootCount++;
      }
    });

    if (trueRootCount > 1) {
      disconnectedTreeNames.add(canonicalName);
    }
  }

  // Also check individual trees that are not part of any AKA mapping
   allTreeNames.forEach(treeName => {
    if (!treeAKAs[treeName] && !Object.values(treeAKAs).includes(treeName)) {
      const treeConnections = connections.filter(c => c.tree === treeName);
      const bitsInTree = new Set(treeConnections.map(c => c.bit));
      const roots = new Set<string>();
      treeConnections.forEach(c => {
        if (!bitsInTree.has(c.byte)) {
          roots.add(c.byte);
        }
      });

      if (roots.size > 1) {
         let trueRootCount = 0;
          roots.forEach(root => {
            if (!allBitsGlobally.has(root)) {
              trueRootCount++;
            }
          });
           if (trueRootCount > 1) {
            disconnectedTreeNames.add(treeName);
          }
      }
    }
  });


  return Array.from(disconnectedTreeNames).filter(name => name !== '(None)').sort();
}
