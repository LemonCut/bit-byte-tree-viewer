
'use client';

import { Chart } from 'react-google-charts';
import type { TreeNode } from '@/lib/types';
import { useEffect, useState, useRef, WheelEvent, MouseEvent } from 'react';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut, LocateFixed, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

interface OrgChartProps {
  data: TreeNode[];
  currentTreeName: string;
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
      const nodeId = node.id;
      let nodeName = `<div style="font-weight: bold;">${node.name}</div>`;
      
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

export function OrgChart({ data, currentTreeName }: OrgChartProps) {
  const [chartData, setChartData] = useState<
    (string | { v: string; f: string } | null)[][]
  >([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isChartVisible, setIsChartVisible] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      setIsChartVisible(false);
      setChartData(formatDataForGoogleChart(data));
      
      // The chart needs a moment to render before we can measure it.
      // requestAnimationFrame is a better choice than setTimeout(0)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            resetView(true);
            setIsChartVisible(true);
        })
      });
    } else {
      setChartData([]);
      setIsChartVisible(false);
    }
  }, [data, currentTreeName]);
  
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY > 0 ? 1.05 : 1 / 1.05; // Reduced zoom speed
    const newScale = Math.max(0.2, Math.min(transform.scale * scaleAmount, 5));

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
    
    setTransform({ scale: newScale, x: newX, y: newY });
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.google-visualization-orgchart-node')) return;
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    e.preventDefault();
    const newX = e.clientX - panStart.x;
    const newY = e.clientY - panStart.y;
    setTransform(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    setIsPanning(false);
  };
  
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    setIsPanning(false);
  }

  const handleZoom = (direction: 'in' | 'out') => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleAmount = direction === 'in' ? 1.2 : 1 / 1.2;
    const newScale = Math.max(0.2, Math.min(transform.scale * scaleAmount, 5));

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newX = centerX - (centerX - transform.x) * (newScale / transform.scale);
    const newY = centerY - (centerY - transform.y) * (newScale / transform.scale);
    
    setTransform({ scale: newScale, x: newX, y: newY });
  };

  const resetView = (initial = false) => {
    if (!containerRef.current || !chartWrapperRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const chartTable = chartWrapperRef.current.querySelector('table');

    if (!chartTable) {
      setTransform({ scale: 1, x: 0, y: 0 });
      return;
    }

    // Use the raw dimensions of the chart table itself for calculations
    const chartWidth = chartTable.offsetWidth;
    const chartHeight = chartTable.offsetHeight;

    if (chartWidth === 0 || chartHeight === 0) return;

    // Calculate scale to fit the chart, with padding
    const scaleX = containerRect.width / chartWidth;
    const scaleY = containerRect.height / chartHeight;
    let newScale = Math.min(scaleX, scaleY) * 0.95;

    // If the tree is smaller than the container, don't zoom in past 100%
    if (newScale > 1) {
      newScale = 1;
    }
    
    // Center the chart
    const newX = (containerRect.width - chartWidth * newScale) / 2;
    const newY = (containerRect.height - chartHeight * newScale) / 2;
    
    setTransform({ scale: newScale, x: newX, y: newY });
  };

  const handleExport = () => {
    if (chartWrapperRef.current === null) {
      return;
    }
    
    const chartTable = chartWrapperRef.current.querySelector('table');
    if (!chartTable) return;

    toPng(chartTable, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${currentTreeName}-tree.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to export chart', err);
      });
  };


  if (!data || data.length === 0) {
    return null;
  }
  
  return (
    <div className="relative w-full h-full overflow-hidden cursor-grab" ref={containerRef} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}>
      <div 
        ref={chartWrapperRef}
        className="w-min h-min absolute top-0 left-0"
        style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            cursor: isPanning ? 'grabbing' : 'grab',
            visibility: isChartVisible ? 'visible' : 'hidden',
        }}
      >
        <Chart
            chartType="OrgChart"
            data={chartData}
            width="100%"
            height="100%"
            options={{
                allowHtml: true,
                nodeClass: 'google-chart-node',
                selectedNodeClass: 'google-chart-node-selected',
                size: 'large',
            }}
        />
      </div>
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
            <Button variant="outline" size="icon" onClick={() => handleZoom('in')} title="Zoom In">
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom In</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleZoom('out')} title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom Out</span>
            </Button>
             <Button variant="outline" size="icon" onClick={handleExport} title="Export as PNG">
                <Download className="h-4 w-4" />
                <span className="sr-only">Export as PNG</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => resetView(false)} title="Reset View">
                <LocateFixed className="h-4 w-4" />
                <span className="sr-only">Reset View</span>
            </Button>
        </div>
    </div>
  );
}
