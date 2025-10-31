export interface Connection {
  byte: string;
  bit: string;
  treeName: string;
  year: number;
}

export interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
}
