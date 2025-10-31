export interface Connection {
  id: string; // Firestore document ID
  byte: string;
  bit: string;
  treeName: string;
  year: number;
}

export interface TreeNode {
  id: string;
  name: string;
  year?: number; // Year is optional as root nodes might not have one
  children: TreeNode[];
}

export interface SearchResult {
  id: string;
  name: string;
  tooltip: string;
  connections: {
    id: string;
    treeName: string;
    year: number | null;
    byte: string | null;
    isRoot: boolean;
  }[];
}
