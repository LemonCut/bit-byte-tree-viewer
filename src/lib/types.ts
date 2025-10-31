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
