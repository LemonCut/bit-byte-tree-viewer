'use client';

import { Chart } from 'react-google-charts';
import type { TreeNode } from '@/lib/types';
import { useEffect, useState, useRef } from 'react';
import type { GoogleChartWrapper, ChartSelection } from 'react-google-charts';

interface OrgChartProps {
  data: TreeNode[];
  highlightedNode: string | null;
  onHighlightComplete: () => void;
}

// Function to convert our tree data into the format Google Charts expects
function formatDataForGoogleChart(treeData: TreeNode[]): (string | { v: string; f: string; } | null)[][] {
  const chartData: (string | { v:string; f: string } | null)[][] = [['Name', 'Parent', 'Tooltip']];
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
         chartData.push([
            { v: nodeId, f: node.name }, // CRITICAL FIX: Use the sanitized 'id' for 'v'
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


export function OrgChart({ data, highlightedNode, onHighlightComplete }: OrgChartProps) {
  const chartWrapperRef = useRef<GoogleChartWrapper>(null);
  const [chartData, setChartData] = useState<(string | { v: string; f: string; } | null)[][]>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(formatDataForGoogleChart(data));
    } else {
      setChartData([]);
    }
  }, [data]);

  useEffect(() => {
    if (highlightedNode && chartWrapperRef.current && chartData.length > 0) {
      const chartWrapper = chartWrapperRef.current;
      const chart = chartWrapper.getChart();
      const dataTable = chartWrapper.getDataTable();
      
      if (chart && dataTable) {
        // Find the row index of the node to highlight
        let rowIndex: number | null = null;
        // The ID in chartData is the `v` property of the first element in each row object.
        for (let i = 1; i < chartData.length; i++) { // Start from 1 to skip header
          const node = chartData[i][0];
          // Compare the `highlightedNode` prop against the `v` property (the sanitized ID).
          if (typeof node === 'object' && node !== null && node.v === highlightedNode) {
            rowIndex = i - 1; // Subtract 1 because dataTable rows are 0-indexed from data
            break;
          }
        }
        
        if (rowIndex !== null) {
            (chart as any).setSelection([{ row: rowIndex, column: null }]);
            
            // Set a timer to remove the highlight
            setTimeout(() => {
                (chart as any).setSelection(null);
                onHighlightComplete();
            }, 1500); // Highlight for 1.5 seconds
        } else {
           onHighlightComplete(); // Node not found, complete highlight cycle
        }
      }
    }
  }, [highlightedNode, onHighlightComplete, chartData]);

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
        getChartWrapper={wrapper => {
          chartWrapperRef.current = wrapper;
        }}
        options={{
          allowHtml: true,
          nodeClass: 'bg-card text-card-foreground',
          selectedNodeClass: 'bg-primary text-primary-foreground',
        }}
      />
    </div>
  );
}
