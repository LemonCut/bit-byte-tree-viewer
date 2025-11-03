
'use client';

import { Chart } from 'react-google-charts';
import type { TreeNode } from '@/lib/types';
import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut, Pencil } from 'lucide-react';
import type { GoogleChartWrapper, GoogleChartEditor } from 'react-google-charts';

interface OrgChartProps {
  data: TreeNode[];
  currentTreeName: string;
  onNodeSelect: (personName: string) => void;
  isAdmin: boolean;
}

// Function to convert our tree data into the format Google Charts expects
function formatDataForGoogleChart(
  treeData: TreeNode[],
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
      let nodeName = `<div style="font-weight: bold;">${node.name}</div>`;
      
      // If the node is a root of a specific tree, append the tree name
      if (node.rootOfTreeName) {
        nodeName += `<div style="font-size:0.8em; color:grey;">${node.rootOfTreeName}</div>`;
      }
      
      const nodeParent = parent;
      const tooltip = createTooltip(node);

      if (!addedNodes.has(nodeId)) {
        chartData.push([{ v: nodeId, f: nodeName }, nodeParent, tooltip]);
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

export function OrgChart({ data, currentTreeName, onNodeSelect, isAdmin }: OrgChartProps) {
  const [chartData, setChartData] = useState<
    (string | { v: string; f: string } | null)[][]
  >([]);
  const [zoom, setZoom] = useState(1);
  const chartWrapperRef = useRef<GoogleChartWrapper>(null);
  const [selectedNode, setSelectedNode] = useState<{name: string, boundingBox: {top: number, left: number, width: number, height: number}} | null>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(formatDataForGoogleChart(data));
      setSelectedNode(null); // Deselect node when data changes
    } else {
      setChartData([]);
    }
  }, [data, currentTreeName]);

  const handleZoomIn = () => setZoom((prev) => prev + 0.1);
  const handleZoomOut = () => setZoom((prev) => Math.max(0.2, prev - 0.1));

  if (!data || data.length === 0) {
    return null;
  }
  
  const chartEvents = [
    {
        eventName: 'select' as const,
        callback: ({ chartWrapper }: { chartWrapper: GoogleChartWrapper }) => {
            if (!isAdmin) return;

            const chart = chartWrapper.getChart();
            const selection = chart.getSelection();

            if (selection.length > 0) {
                const selectedRow = selection[0].row;
                if (selectedRow !== null && selectedRow !== undefined) {
                    const dataTable = chartWrapper.getDataTable();
                    if (dataTable) {
                        const personId = dataTable.getValue(selectedRow, 0);
                        const cli = chartWrapper.getChartLayoutInterface();
                        const boundingBox = cli.getBoundingBox(`bar#0#${selectedRow}`);
                        
                        setSelectedNode({
                            name: personId,
                            boundingBox: boundingBox,
                        });
                    }
                }
            } else {
                 setSelectedNode(null);
            }
        },
    },
  ];

  return (
    <div className="relative w-full h-full">
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom In</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom Out</span>
            </Button>
        </div>
      <div className="w-full h-full overflow-auto" id="chart-container">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%`, height: `${100 / zoom}%`, position: 'relative' }}>
            {isAdmin && selectedNode && (
                 <Button
                    variant="outline"
                    size="icon"
                    className="absolute z-20 h-8 w-8"
                    style={{
                        top: `${selectedNode.boundingBox.top - 40}px`,
                        left: `${selectedNode.boundingBox.left + (selectedNode.boundingBox.width / 2) - 16}px`,
                    }}
                    onClick={() => onNodeSelect(selectedNode.name)}
                >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Modify Person</span>
                </Button>
            )}
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
                chartEvents={chartEvents}
                chartWrapperParams={{
                    // This is needed to get layout interface
                    chartType: 'OrgChart',
                    containerId: 'chart-container',
                }}
            />
        </div>
      </div>
    </div>
  );
}
