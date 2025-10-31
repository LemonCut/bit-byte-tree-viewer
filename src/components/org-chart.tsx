'use client';

import { Chart } from 'react-google-charts';
import type { TreeNode } from '@/lib/types';
import { useEffect, useState } from 'react';

interface OrgChartProps {
  data: TreeNode[];
}

// Function to convert our tree data into the format Google Charts expects
function formatDataForGoogleChart(
  treeData: TreeNode[]
): (string | { v: string; f: string } | null)[][] {
  const chartData: (string | { v: string; f: string } | null)[][] = [
    ['Name', 'Parent', 'Tooltip'],
  ];
  const addedNodes = new Set<string>();

  function createTooltip(node: TreeNode): string {
    return `${node.name}${node.year ? `\nPickup Year: ${node.year}` : ''}`;
  }

  function traverse(nodes: TreeNode[], parent: string | null = null) {
    nodes.forEach((node) => {
      // Each node in the Google Org Chart must have a unique ID.
      // We use the sanitized `id` for the chart's internal value `v`, and the `name` for display `f`.
      const nodeId = node.id;
      const nodeParent = parent;
      const tooltip = createTooltip(node);

      if (!addedNodes.has(nodeId)) {
        chartData.push([{ v: nodeId, f: node.name }, nodeParent, tooltip]);
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
  const [chartData, setChartData] = useState<
    (string | { v: string; f: string } | null)[][]
  >([]);

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(formatDataForGoogleChart(data));
    } else {
      setChartData([]);
    }
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-full">
      <Chart
        chartType="OrgChart"
        data={chartData}
        width="100%"
        height="400px"
        options={{
          allowHtml: true,
          nodeClass: 'google-chart-node',
          selectedNodeClass: 'google-chart-node-selected',
        }}
      />
    </div>
  );
}
