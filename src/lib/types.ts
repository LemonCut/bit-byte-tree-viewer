export interface Connection {
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
  name: string;
  connections: {
    treeName: string;
    year: number | null;
    byte: string | null;
    isRoot: boolean;
  }[];
}
