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
import { ArrowLeft, Home, Maximize2, Star } from 'lucide-react';


const nodeTypes: NodeTypes = {
  character: CharacterNode,
};

interface GraphClientProps {
  work: Work;
  initialNodes: Node[];
  initialEdges: Edge[];
  protagonist?: string;
}

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

// 右键菜单状态
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
}

function GraphClientInner({ work, initialNodes, initialEdges, protagonist }: GraphClientProps) {
  const defaultProtagonist = protagonist || (initialNodes.length > 0 ? initialNodes[0].id : '');

  // 主节点
  const [mainCharacter, setMainCharacter] = useState<string>(defaultProtagonist);

  // 已展开的节点集合 - 默认仅展开主节点
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set([defaultProtagonist]));

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: '',
    nodeName: '',
  });

  const [mounted, setMounted] = useState(false);
  const [simulationReady, setSimulationReady] = useState(false);

  const simulationRef = useRef<Simulation<D3Node, D3Link> | null>(null);
  const d3NodesRef = useRef<D3Node[]>([]);

  // === 计算可见节点/边 ===
  const { visibleNodes, visibleEdges } = useMemo(() => {
    const visibleNodeIds = new Set<string>();

    // 主节点始终可见
    visibleNodeIds.add(mainCharacter);

    // 仅已展开节点的直接关联可见
    expandedNodes.forEach(nodeId => {
      visibleNodeIds.add(nodeId);
      initialEdges.forEach(edge => {
        if (edge.source === nodeId) visibleNodeIds.add(edge.target);
        if (edge.target === nodeId) visibleNodeIds.add(edge.source);
      });
    });

    // 过滤边：两端都在可见节点中，且至少有一端是已展开的节点（或者是主节点）
    const relevantEdges = initialEdges.filter(edge => {
      const sourceVisible = visibleNodeIds.has(edge.source);
      const targetVisible = visibleNodeIds.has(edge.target);
      if (!sourceVisible || !targetVisible) return false;

      // 仅当边的至少一端被展开时，才显示这条边
      // 注意：主节点总是在 expandedNodes 中（初始化时加入），所以与主节点相连的边总是显示的
      const sourceExpanded = expandedNodes.has(edge.source);
      const targetExpanded = expandedNodes.has(edge.target);

      return sourceExpanded || targetExpanded;
    }).map(edge => {
      // === 样式逻辑 ===
      // 安全检查：防止D3仿真可能导致 source/target 变为对象引用
      const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
      const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;

      const isConnectedToMain = sourceId === mainCharacter || targetId === mainCharacter;

      let edgeClassName = 'edge-default';

      if (isConnectedToMain) {
        // 一级连线：主节点 <-> 二级节点
        const otherNode = sourceId === mainCharacter ? targetId : sourceId;
        if (expandedNodes.has(otherNode)) {
          // 如果该二级节点被展开 -> 高亮 (Amber)
          edgeClassName = 'edge-main-highlight';
        } else {
          // 未展开 -> 默认深灰
          edgeClassName = 'edge-default';
        }
      } else {
        // 二级连线 (Blue)
        edgeClassName = 'edge-secondary-highlight';
      }

      return {
        ...edge,
        className: edgeClassName,
        style: {
          strokeDasharray: '5,5',
        }
      };
    });

    // 过滤节点并添加高亮标记
    const filteredNodes = initialNodes
      .filter(node => visibleNodeIds.has(node.id))
      .map(node => ({
        ...node,
        data: {
          ...node.data,
          isFocused: node.id === mainCharacter,
          isFromSource: expandedNodes.has(node.id) && node.id !== mainCharacter,
        } as CharacterNodeData,
      }));

    return { visibleNodes: filteredNodes, visibleEdges: relevantEdges };
  }, [mainCharacter, expandedNodes, initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(visibleNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(visibleEdges);

  useEffect(() => {
    setNodes(visibleNodes);
    setEdges(visibleEdges);
    // 不再重置 simulationReady，让新节点平滑加入
  }, [visibleNodes, visibleEdges, setNodes, setEdges]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // === 物理模拟 ===
  useEffect(() => {
    if (!mounted || visibleNodes.length === 0) return;

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const nodeCount = visibleNodes.length;
    // 智能合并节点位置：保留已有节点的位置，仅初始化新节点
    const d3Nodes: D3Node[] = visibleNodes.map((node, index) => {
      // 尝试在现有模拟中找到该节点
      const existingNode = d3NodesRef.current.find(n => n.id === node.id);
      if (existingNode) {
        return existingNode;
      }

      // 如果是主节点（初始化时可能没有 existingNode），固定在中心
      if (node.id === mainCharacter) {
        return { id: node.id, x: 0, y: 0, fx: 0, fy: 0 };
      }

      // 新节点初始化：尝试找到它的“父节点”（即它连接到的已存在节点）
      // 这样新节点会从父节点附近“长”出来
      let parentNode: D3Node | undefined;
      const connectedEdge = visibleEdges.find(e =>
        (e.source === node.id && d3NodesRef.current.some(n => n.id === e.target)) ||
        (e.target === node.id && d3NodesRef.current.some(n => n.id === e.source))
      );

      if (connectedEdge) {
        const parentId = connectedEdge.source === node.id ? connectedEdge.target : connectedEdge.source;
        parentNode = d3NodesRef.current.find(n => n.id === parentId);
      }

      if (parentNode && parentNode.x !== undefined && parentNode.y !== undefined) {
        // 从父节点附近随机位置生成
        const angle = Math.random() * 2 * Math.PI;
        const distance = 50; // 初始距离较近，然后被弹开
        return {
          id: node.id,
          x: parentNode.x + Math.cos(angle) * distance,
          y: parentNode.y + Math.sin(angle) * distance,
        };
      }

      // 兜底：如果没有找到父节点（不应该发生，除非是断开的图），沿用原来的环形布局
      const angle = (2 * Math.PI * index) / (nodeCount - 1 || 1);
      const radius = 250 + Math.random() * 100;
      return {
        id: node.id,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });

    d3NodesRef.current = d3Nodes;

    const d3Links: D3Link[] = visibleEdges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const simulation = forceSimulation<D3Node, D3Link>(d3Nodes)
      .force("link", forceLink<D3Node, D3Link>(d3Links)
        .id((d) => d.id)
        .distance((link) => {
          // 动态边长逻辑：
          // 1. 获取连接的两个节点ID (兼容D3对象转换)
          const sourceId = (link.source as any).id || link.source;
          const targetId = (link.target as any).id || link.target;

          const isMainConnection = sourceId === mainCharacter || targetId === mainCharacter;

          if (isMainConnection) {
            const otherNode = sourceId === mainCharacter ? targetId : sourceId;
            // 如果是连接到“已展开”的二级节点，增加斥力距离（推远）
            // 这样能让二级节点的子网络有更多空间展示，不与主网络重叠
            if (expandedNodes.has(otherNode)) {
              return 550;
            }
            return 250; // 主网络默认间距
          }
          return 150; // 二级网络内部紧凑一些
        })
        .strength(0.2)
      )
      .force("charge", forceManyBody<D3Node>().strength(-2000).distanceMax(3000)) // 强力斥力
      .force("collide", forceCollide<D3Node>(95).strength(0.8))
      .force("center", forceCenter(0, 0).strength(0.005)) // 弱中心引力，允许扩散
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    // 如果是由于节点增加导致的更新，使用较小的 alpha重新加热模拟，避免剧烈跳动
    // 如果是首次加载（d3NodesRef之前为空），则使用完全重启
    if (d3NodesRef.current.length > 0 && simulationReady) {
      simulation.alpha(0.8).restart();
    } else {
      simulation.alpha(1).restart();
    }

    simulation.on("tick", () => {
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
    setTimeout(() => setSimulationReady(true), 700);

    return () => {
      simulation.stop();
    };
  }, [mounted, visibleNodes, visibleEdges, mainCharacter, setNodes]);

  // === 自动 fitView ===
  const reactFlowInstance = useReactFlow();
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (simulationReady && reactFlowInstance) {
      // 统一逻辑：
      // 1. 首次加载 (initialFitDone) -> 瞬间全屏 (duration: 0)
      // 2. 切换主节点 (mainCharacter变化) -> 瞬间全屏 (duration: 0)
      // 3. 普通展开/收起节点 -> 不触发 fitView (保持当前视角，避免“变大变小”跳动) (移除了 expandedNodes 依赖)

      const isInitialLoad = !initialFitDone.current;

      if (isInitialLoad) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 0, maxZoom: 1 });
        initialFitDone.current = true;
      } else {
        // 主节点切换触发的更新，也要瞬间全屏，但限制最大缩放比例，防止节点过少时过大
        reactFlowInstance.fitView({ padding: 0.2, duration: 0, maxZoom: 1 });
      }
    }
  }, [simulationReady, reactFlowInstance, mainCharacter]);

  // 菜单 ref
  const menuRef = useRef<HTMLDivElement>(null);

  // === 关闭菜单 ===
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 点击背景关闭菜单 (mousedown防止与click冲突)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // 如果点击在菜单内，不关闭
      if (menuRef.current && menuRef.current.contains(e.target as globalThis.Node)) {
        return;
      }
      closeContextMenu();
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [closeContextMenu]);

  // === 点击节点 → 显示菜单 ===
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeName: node.data.label || node.id,
    });
  }, []);

  // === 右键节点 → 显示菜单 ===
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeName: node.data.label || node.id,
    });
  }, []);

  // === 菜单操作：展开/收起节点 ===
  const handleExpandToggle = useCallback(() => {
    const nodeId = contextMenu.nodeId;
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        // 收起（主节点不可收起）
        if (nodeId !== mainCharacter) {
          next.delete(nodeId);
        }
      } else {
        // 展开
        next.add(nodeId);
      }
      return next;
    });
    closeContextMenu();
  }, [contextMenu.nodeId, mainCharacter, closeContextMenu]);

  // === 菜单操作：设为主节点 ===
  const handleSetAsMain = useCallback(() => {
    const nodeId = contextMenu.nodeId;
    setMainCharacter(nodeId);
    setExpandedNodes(new Set([nodeId]));
    // 重置物理模拟状态，确保新主节点从中心 (0,0) 开始生成，防止画面偏移
    d3NodesRef.current = [];
    closeContextMenu();
  }, [contextMenu.nodeId, closeContextMenu]);

  // === 重置 ===
  const handleReset = useCallback(() => {
    setMainCharacter(defaultProtagonist);
    setExpandedNodes(new Set([defaultProtagonist]));
    // 重置物理模拟状态
    d3NodesRef.current = [];
    // 强制归位 (无论主节点是否变化)，遵循“统一逻辑”
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 0, maxZoom: 1 });
    }
  }, [defaultProtagonist, reactFlowInstance]);

  // === 拖拽 ===
  const onNodeDragStart = useCallback(() => {
    closeContextMenu();
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart();
    }
  }, [closeContextMenu]);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    const d3Node = d3NodesRef.current.find((n) => n.id === node.id);
    if (d3Node) {
      d3Node.fx = node.position.x;
      d3Node.fy = node.position.y;
    }
  }, []);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    const d3Node = d3NodesRef.current.find((n) => n.id === node.id);
    if (d3Node) {
      d3Node.fx = null;
      d3Node.fy = null;
    }
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.1).restart();
      setTimeout(() => simulationRef.current?.alphaTarget(0), 600);
    }
  }, []);

  // === 边样式 ===
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      type: 'straight',
      label: edge.label || '',
      labelStyle: { fontSize: 13, fontWeight: 600, fill: '#555' },
      labelShowBg: true,
      labelBgStyle: { fill: 'rgba(255, 255, 255, 0.95)', fillOpacity: 0.95 },
      labelBgPadding: [8, 5] as [number, number],
      labelBgBorderRadius: 6,
      style: { stroke: 'rgba(100, 100, 100, 0.35)', strokeWidth: 1.5 },
      animated: false,
    }));
  }, [edges]);

  // 判断当前节点是否已展开
  const isNodeExpanded = expandedNodes.has(contextMenu.nodeId);
  const isNodeMain = contextMenu.nodeId === mainCharacter;

  if (!mounted) return null;

  return (
    <div className="w-full h-screen bg-background text-foreground overflow-hidden relative transition-colors duration-300">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full z-40 p-6 pointer-events-none">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 pointer-events-auto">
            <Link href="/" className="group flex items-center gap-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors">
              <div className="p-2 rounded-full bg-white/50 dark:bg-white/5 group-hover:bg-white/80 dark:group-hover:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/10">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium tracking-wide">首页</span>
            </Link>

            {/* 重置按钮 */}
            <AnimatePresence>
              {(mainCharacter !== defaultProtagonist || expandedNodes.size > 1) && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={handleReset}
                  className="group flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                >
                  <div className="p-2 rounded-full bg-amber-100/80 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40 backdrop-blur-md border border-amber-200 dark:border-amber-700">
                    <Home className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">重置</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="text-right pointer-events-auto pr-4 md:pr-0 mt-0">
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-1" style={{ color: work.coverColor }}>
              {work.title}
            </h1>
            <p className="text-black/40 dark:text-white/40 text-xs md:text-sm font-mono">{work.author} · {work.year}</p>
            <motion.div
              key={mainCharacter}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm mt-2 hidden md:block"
            >
              <span className="text-black/60 dark:text-white/60">
                主节点: <span className="font-semibold text-amber-600 dark:text-amber-400">{mainCharacter}</span>
              </span>
              <span className="text-black/30 dark:text-white/30 ml-3">
                展开 {expandedNodes.size} 个 · 显示 {visibleNodes.length} 人
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Graph */}
      <motion.div
        key={mainCharacter}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: simulationReady ? 1 : 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
      >
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          minZoom={0.05}
          maxZoom={5}
          connectionMode={ConnectionMode.Loose}
          proOptions={{ hideAttribution: true }}
          className="transition-colors duration-300"
        >
          <Background color={'#000'} gap={20} size={1} style={{ opacity: 0.03 }} />
          <Controls showInteractive={false} showFitView={true} className="!bg-white/50 !border-black/10 !fill-black/60 !mb-6" />
        </ReactFlow>
      </motion.div>

      {/* 右键/点击菜单 */}
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{contextMenu.nodeName}</p>
            </div>
            <div className="py-1">
              {/* 展开/收起 */}
              <button
                onClick={handleExpandToggle}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-3 transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {isNodeExpanded ? (isNodeMain ? '已展开（主节点）' : '收起节点') : '展开节点'}
                </span>
              </button>

              {/* 设为主节点 */}
              {!isNodeMain && (
                <button
                  onClick={handleSetAsMain}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-900/30 flex items-center gap-3 transition-colors"
                >
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-gray-700 dark:text-gray-300">设为主节点</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作提示 */}
      <div className="absolute bottom-6 right-6 z-40 pointer-events-none text-right">
        <p className="text-xs text-black/30 dark:text-white/30">
          点击人物查看选项
        </p>
      </div>
    </div>
  );
}

export function GraphClient(props: GraphClientProps) {
  return (
    <ReactFlowProvider>
      <GraphClientInner {...props} />
    </ReactFlowProvider>
  );
}
