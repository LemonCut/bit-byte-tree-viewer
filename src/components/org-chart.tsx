'use client';

import { Chart } from 'react-google-charts';
import type { TreeNode } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface OrgChartProps {
  data: TreeNode[];
  currentTreeName: string;
}

// Function to convert our tree data into the format Google Charts expects
function formatDataForGoogleChart(
  treeData: TreeNode[],
  treeName: string
): (string | { v: string; f: string } | null)[][] {
  const chartData: (string | { v: string; f: string } | null)[][] = [
    ['Name', 'Parent', 'Tooltip'],
  ];
  const addedNodes = new Set<string>();

  function createTooltip(node: TreeNode): string {
     return `${node.name}\nTree: ${treeName}${node.year ? `\nPickup Year: ${node.year}` : ''}`;
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

export function OrgChart({ data, currentTreeName }: OrgChartProps) {
  const [chartData, setChartData] = useState<
    (string | { v: string; f: string } | null)[][]
  >([]);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(formatDataForGoogleChart(data, currentTreeName));
    } else {
      setChartData([]);
    }
  }, [data, currentTreeName]);

  const handleZoomIn = () => setZoom((prev) => prev + 0.1);
  const handleZoomOut = () => setZoom((prev) => Math.max(0.2, prev - 0.1));

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
        <div className="absolute top-0 right-0 z-10 flex gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom In</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom Out</span>
            </Button>
        </div>
      <div className="w-full h-[calc(100%-40px)] overflow-auto">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%`, height: `${100 / zoom}%` }}>
            <Chart
                chartType="OrgChart"
                data={chartData}
                width="100%"
                height="400px"
                options={{
                    allowHtml: true,
                    nodeClass: 'google-chart-node',
                    selectedNodeClass: 'google-chart-node-selected',
                    size: 'large', // Ensures the nodes are large enough to be readable
                }}
            />
        </div>
      </div>
    </div>
  );
}
