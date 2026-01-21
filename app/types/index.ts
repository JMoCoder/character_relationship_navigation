export interface Work {
  id: string;
  title: string;
  category: string;
  description: string;
  year: string;
  author: string;
  coverColor: string; // Hex color for theming
}

export interface CharacterNodeData {
  label: string;
  role?: string;
  avatar?: string;
  description?: string;
  isFocused?: boolean;      // 当前焦点人物 - 主高亮
  isFromSource?: boolean;   // 导航来源人物 - 次高亮
}

export interface RelationshipEdgeData {
  label: string;
  description?: string;
}

// Re-export React Flow types for convenience if needed,
// but usually we just use the Node/Edge types from reactflow directly
// combined with our custom data interfaces.
