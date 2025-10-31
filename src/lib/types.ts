export interface Connection {
  big: string;
  little: string;
  treeName: string;
  year: number;
}

export interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
}
