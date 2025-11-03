
export interface Connection {
  id: string; // Firestore document ID
  bitId: string;
  bitName: string;
  byteId: string;
  byteName: string;
  treeName: string;
  year: number;
}

export interface Person {
    id: string;
    name: string;
}

export interface TreeNode {
  id: string; // This will be the Person ID
  name: string;
  year?: number; // Year is optional as root nodes might not have one
  rootOfTreeName?: string; // Optional: name of the tree this node is a root of
  children: TreeNode[];
}

export interface SearchResult {
  id: string; // Person ID
  name: string;
  tooltip: string;
  connections: {
    connectionId: string;
    treeName: string;
    year: number | null;
    isBit: boolean; // True if they are the bit in this connection
    isByte: boolean; // True if they are the byte
    otherPersonName: string | null; // The name of the other person in the connection
    isRoot: boolean;
  }[];
}

export interface TreeAKA {
  [originalName: string]: string;
}
