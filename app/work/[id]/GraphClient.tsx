"use client";

import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  NodeTypes,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  Simulation
} from 'd3-force';
import { CharacterNode } from '@/app/components/CharacterNode';
import { Work, CharacterNodeData } from '@/app/types';
import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';


const nodeTypes: NodeTypes = {
  character: CharacterNode,
};

interface GraphClientProps {
  work: Work;
  initialNodes: Node[];
  initialEdges: Edge[];
  protagonist?: string; // 主人公名称，默认为第一个节点
}

// Extend Node for D3 compatibility
interface D3Node extends SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
}

function GraphClientInner({ work, initialNodes, initialEdges, protagonist }: GraphClientProps) {
  // 确定主人公
  const defaultProtagonist = protagonist || (initialNodes.length > 0 ? initialNodes[0].id : '');

  // 焦点状态管理
  const [focusedCharacter, setFocusedCharacter] = useState<string>(defaultProtagonist);
  const [previousCharacter, setPreviousCharacter] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  const [mounted, setMounted] = useState(false);
  const [simulationReady, setSimulationReady] = useState(false);

  // Refs for D3 simulation
  const simulationRef = useRef<Simulation<D3Node, D3Link> | null>(null);
  const d3NodesRef = useRef<D3Node[]>([]);

  // 计算当前焦点人物的直接关联
  const { visibleNodes, visibleEdges } = useMemo(() => {
    // 找出与焦点人物有直接关系的所有节点ID
    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(focusedCharacter);

    const relevantEdges: Edge[] = [];

    initialEdges.forEach(edge => {
      if (edge.source === focusedCharacter) {
        connectedNodeIds.add(edge.target);
        relevantEdges.push(edge);
      } else if (edge.target === focusedCharacter) {
        connectedNodeIds.add(edge.source);
        relevantEdges.push(edge);
      }
    });

    // 过滤节点，并添加高亮标记
    const filteredNodes = initialNodes
      .filter(node => connectedNodeIds.has(node.id))
      .map(node => ({
        ...node,
        data: {
          ...node.data,
          isFocused: node.id === focusedCharacter,
          isFromSource: node.id === previousCharacter,
        } as CharacterNodeData,
      }));

    return { visibleNodes: filteredNodes, visibleEdges: relevantEdges };
  }, [focusedCharacter, previousCharacter, initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(visibleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(visibleEdges);

  // 当可见节点变化时更新
  useEffect(() => {
    setNodes(visibleNodes);
    setEdges(visibleEdges);
    setSimulationReady(false);
  }, [visibleNodes, visibleEdges, setNodes, setEdges]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize Physics Simulation - 重新初始化当焦点变化时
  useEffect(() => {
    if (!mounted || visibleNodes.length === 0) return;

    // 停止之前的模拟
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create D3 nodes with radial initial positions - 更大的初始半径
    const nodeCount = visibleNodes.length;
    const d3Nodes: D3Node[] = visibleNodes.map((node, index) => {
      if (node.id === focusedCharacter) {
        // 焦点人物放在中心
        return { id: node.id, x: 0, y: 0 };
      }
      const angle = (2 * Math.PI * index) / (nodeCount - 1 || 1);
      const radius = 280 + Math.random() * 80; // 更大的初始半径
      return {
        id: node.id,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });

    d3NodesRef.current = d3Nodes;

    // Create D3 links
    const d3Links: D3Link[] = visibleEdges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    // Create simulation - 优化物理参数
    const simulation = forceSimulation<D3Node, D3Link>(d3Nodes)
      .force("link", forceLink<D3Node, D3Link>(d3Links).id((d) => d.id).distance(300).strength(0.25)) // 更长的连接线
      .force("charge", forceManyBody<D3Node>().strength(-1200).distanceMax(800)) // 更强的排斥力
      .force("collide", forceCollide<D3Node>(100).strength(0.8)) // 更大的碰撞半径
      .force("center", forceCenter(0, 0).strength(0.03)) // 更弱的中心力
      .alphaDecay(0.015) // 更慢的衰减，更丝滑
      .velocityDecay(0.25); // 更低的阻尼，更流畅

    simulation.on("tick", () => {
      // Update React state with new positions
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const d3Node = d3NodesRef.current.find((n) => n.id === node.id);
          if (d3Node && d3Node.x !== undefined && d3Node.y !== undefined) {
            return {
              ...node,
              position: { x: d3Node.x, y: d3Node.y },
            };
          }
          return node;
        })
      );
    });

    simulation.on("end", () => {
      setSimulationReady(true);
    });

    simulationRef.current = simulation;

    // Let simulation run for initial layout
    setTimeout(() => setSimulationReady(true), 600);

    return () => {
      simulation.stop();
    };
  }, [mounted, visibleNodes, visibleEdges, focusedCharacter, setNodes]);

  // 获取 ReactFlow 实例用于 fitView
  const reactFlowInstance = useReactFlow();

  // 模拟稳定后自动执行 fitView
  useEffect(() => {
    if (simulationReady && reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      }, 100);
    }
  }, [simulationReady, reactFlowInstance, focusedCharacter]);

  // 点击节点 - 导航到该人物的关系图谱
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id !== focusedCharacter) {
      // 记录导航历史
      setNavigationHistory(prev => [...prev, focusedCharacter]);
      setPreviousCharacter(focusedCharacter);
      setFocusedCharacter(node.id);
    }
  }, [focusedCharacter]);

  // 返回上一级
  const handleGoBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      const newHistory = [...navigationHistory];
      const lastCharacter = newHistory.pop()!;
      setNavigationHistory(newHistory);
      setPreviousCharacter(focusedCharacter);
      setFocusedCharacter(lastCharacter);
    }
  }, [navigationHistory, focusedCharacter]);

  // 回到主人公
  const handleGoToProtagonist = useCallback(() => {
    if (focusedCharacter !== defaultProtagonist) {
      setNavigationHistory([]);
      setPreviousCharacter(focusedCharacter);
      setFocusedCharacter(defaultProtagonist);
    }
  }, [focusedCharacter, defaultProtagonist]);

  // Track dragged node's connected neighbors
  const draggedNodeRef = useRef<string | null>(null);
  const connectedNodesRef = useRef<Map<string, { dx: number; dy: number }>>(new Map());

  // Find all directly connected node IDs
  const getConnectedNodeIds = useCallback((nodeId: string): string[] => {
    const connected: string[] = [];
    visibleEdges.forEach(edge => {
      if (edge.source === nodeId) connected.push(edge.target);
      if (edge.target === nodeId) connected.push(edge.source);
    });
    return connected;
  }, [visibleEdges]);

  // Drag Interactions
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    draggedNodeRef.current = node.id;

    // Find connected nodes and store their relative positions
    const connectedIds = getConnectedNodeIds(node.id);
    const relativePositions = new Map<string, { dx: number; dy: number }>();

    connectedIds.forEach(id => {
      const connectedD3Node = d3NodesRef.current.find(n => n.id === id);
      if (connectedD3Node && connectedD3Node.x !== undefined && connectedD3Node.y !== undefined) {
        relativePositions.set(id, {
          dx: connectedD3Node.x - node.position.x,
          dy: connectedD3Node.y - node.position.y
        });
      }
    });
    connectedNodesRef.current = relativePositions;

    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart(); // 更高的alpha让拖拽更丝滑
    }
  }, [getConnectedNodeIds]);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    const d3Node = d3NodesRef.current.find((n) => n.id === node.id);
    if (d3Node) {
      d3Node.fx = node.position.x;
      d3Node.fy = node.position.y;
    }

    // Move connected nodes with reduced effect (they follow but with some lag/offset)
    connectedNodesRef.current.forEach((offset, connectedId) => {
      const connectedD3Node = d3NodesRef.current.find(n => n.id === connectedId);
      if (connectedD3Node) {
        // Apply gentle pull towards relative position (creates elastic effect)
        const targetX = node.position.x + offset.dx;
        const targetY = node.position.y + offset.dy;

        if (connectedD3Node.x !== undefined && connectedD3Node.y !== undefined) {
          connectedD3Node.vx = (connectedD3Node.vx || 0) + (targetX - connectedD3Node.x) * 0.1;
          connectedD3Node.vy = (connectedD3Node.vy || 0) + (targetY - connectedD3Node.y) * 0.1;
        }
      }
    });
  }, []);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    const d3Node = d3NodesRef.current.find((n) => n.id === node.id);
    if (d3Node) {
      // 释放节点，让它回到物理模拟中 - 取消固定位置
      d3Node.fx = null;
      d3Node.fy = null;
    }

    // Clear drag state
    draggedNodeRef.current = null;
    connectedNodesRef.current.clear();

    if (simulationRef.current) {
      // 轻微激活模拟让节点自然归位
      simulationRef.current.alphaTarget(0.1).restart();
      setTimeout(() => {
        simulationRef.current?.alphaTarget(0);
      }, 800);
    }
  }, []);

  // Double-click to unpin a node
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    const d3Node = d3NodesRef.current.find((n) => n.id === node.id);
    if (d3Node) {
      d3Node.fx = null;
      d3Node.fy = null;
    }
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart();
      setTimeout(() => {
        simulationRef.current?.alphaTarget(0);
      }, 500);
    }
  }, []);

  // Edge Styles - 带标签的连接线
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      type: 'straight', // 使用直线类型确保标签居中
      label: edge.label || '',
      labelStyle: {
        fontSize: 13,
        fontWeight: 600,
        fill: '#555',
      },
      labelShowBg: true,
      labelBgStyle: {
        fill: 'rgba(255, 255, 255, 0.95)',
        fillOpacity: 0.95,
      },
      labelBgPadding: [8, 5] as [number, number],
      labelBgBorderRadius: 6,
      style: {
        stroke: 'rgba(100, 100, 100, 0.35)',
        strokeWidth: 1.5,
      },
      animated: false,
    }));
  }, [edges]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full h-screen bg-background text-foreground overflow-hidden relative transition-colors duration-300">
      {/* Header / Navigation */}
      <div className="absolute top-0 left-0 w-full z-40 p-6 pointer-events-none">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 pointer-events-auto">
            <Link href="/" className="group flex items-center gap-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors">
              <div className="p-2 rounded-full bg-white/50 dark:bg-white/5 group-hover:bg-white/80 dark:group-hover:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/10">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium tracking-wide">首页</span>
            </Link>

            {/* 返回上一级按钮 */}
            <AnimatePresence>
              {navigationHistory.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={handleGoBack}
                  className="group flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors ml-2"
                >
                  <div className="p-2 rounded-full bg-blue-100/80 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 backdrop-blur-md border border-blue-200 dark:border-blue-700">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">返回</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* 回到主人公按钮 */}
            <AnimatePresence>
              {focusedCharacter !== defaultProtagonist && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={handleGoToProtagonist}
                  className="group flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                >
                  <span className="font-medium text-sm px-3 py-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
                    回到 {defaultProtagonist}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="text-right pointer-events-auto pr-20 md:pr-0 mt-12 md:mt-0">
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <h1 className="text-4xl font-bold tracking-tight mb-1" style={{ color: work.coverColor }}>
              {work.title}
            </h1>
            <p className="text-black/40 dark:text-white/40 text-sm font-mono">{work.author} · {work.year}</p>
            {/* 当前焦点指示 */}
            <motion.p
              key={focusedCharacter}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-black/60 dark:text-white/60 text-sm mt-2"
            >
              当前关注: <span className="font-semibold text-amber-600 dark:text-amber-400">{focusedCharacter}</span>
              <span className="text-black/30 dark:text-white/30 ml-2">
                ({visibleNodes.length - 1} 个关联人物)
              </span>
            </motion.p>
          </div>
        </div>
      </div>

      {/* Graph Area */}
      <motion.div
        key={focusedCharacter}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: simulationReady ? 1 : 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full h-full"
      >
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.05}
          maxZoom={5}
          connectionMode={ConnectionMode.Loose}
          proOptions={{ hideAttribution: true }}
          className="transition-colors duration-300"
        >
          <Background
            color={'#000'}
            gap={20}
            size={1}
            style={{ opacity: 0.03 }}
          />
          <Controls
            showInteractive={false}
            showFitView={true}
            className="!bg-white/50 !border-black/10 !fill-black/60 !mb-6"
          />
        </ReactFlow>
      </motion.div>


    </div>
  );
}

// 包装组件，提供 ReactFlowProvider
export function GraphClient(props: GraphClientProps) {
  return (
    <ReactFlowProvider>
      <GraphClientInner {...props} />
    </ReactFlowProvider>
  );
}
