'use client';

import { Chart } from 'react-google-charts';
import type { TreeNode } from '@/lib/types';

interface OrgChartProps {
  data: TreeNode[];
}

// Function to convert our tree data into the format Google Charts expects
function formatDataForGoogleChart(treeData: TreeNode[]): (string | { v: string; f: string; } | null)[][] {
  const chartData: (string | { v: string; f: string; } | null)[][] = [['Name', 'Parent', 'Tooltip']];
  const addedNodes = new Set<string>();

  function createTooltip(node: TreeNode): string {
    return `${node.name}${node.year ? `\nPickup Year: ${node.year}` : ''}`;
  }

  function traverse(nodes: TreeNode[], parent: string | null = null) {
    nodes.forEach((node) => {
      // Each node in the Google Org Chart must have a unique ID.
      // We use the name, but if names can be duplicated across different
      // branches, a more robust unique ID generation would be needed.
      const nodeId = node.id;
      const nodeParent = parent;
      const tooltip = createTooltip(node);
      
      if (!addedNodes.has(nodeId)) {
         chartData.push([
            { v: nodeId, f: node.name },
            nodeParent,
            tooltip,
        ]);
        addedNodes.add(nodeId);
      }
      
      if (node.children && node.children.length > 0) {
        traverse(node.children, nodeId);
      }
    });
  }

  traverse(treeData);
  
  return chartData;
}


export function OrgChart({ data }: OrgChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const chartData = formatDataForGoogleChart(data);

  return (
    <div className="w-full h-full">
      <Chart
        chartType="OrgChart"
        data={chartData}
        width="100%"
        height="400px"
        options={{
          allowHtml: true,
          nodeClass: 'bg-card text-card-foreground',
          selectedNodeClass: 'bg-primary text-primary-foreground',
        }}
      />
    </div>
  );
}
