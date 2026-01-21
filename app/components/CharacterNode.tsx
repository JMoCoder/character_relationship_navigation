"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CharacterNodeData } from '@/app/types';

export const CharacterNode = memo(({ data, selected }: NodeProps<CharacterNodeData>) => {
  const { isFocused, isFromSource } = data;

  // Determine highlight state
  const getHighlightClasses = () => {
    if (isFocused) {
      return 'scale-110 ring-4 ring-amber-400/60 z-50';
    }
    if (isFromSource) {
      return 'scale-105 ring-3 ring-blue-400/40 z-40';
    }
    if (selected) {
      return 'scale-110 ring-4 ring-black/10 z-50';
    }
    return 'hover:scale-105 active:scale-95';
  };

  const getGlowClasses = () => {
    if (isFocused) {
      return 'bg-amber-400/40 opacity-100';
    }
    if (isFromSource) {
      return 'bg-blue-400/30 opacity-100';
    }
    if (selected) {
      return 'bg-blue-500/30 opacity-100';
    }
    return 'bg-black/5 opacity-0 group-hover:opacity-100';
  };

  const getBubbleClasses = () => {
    if (isFocused) {
      return 'bg-amber-50 border-amber-300';
    }
    if (isFromSource) {
      return 'bg-blue-50 border-blue-200';
    }
    if (selected) {
      return 'bg-blue-50';
    }
    return '';
  };

  return (
    <div className={`
      relative group rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center 
      transition-all duration-500 ease-out z-10 cursor-pointer
      ${getHighlightClasses()}
    `}>
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full blur-md transition-opacity duration-500 ${getGlowClasses()}`} />

      {/* Text Bubble */}
      <div className={`
        relative w-full h-full rounded-full overflow-hidden 
        border border-black/10
        bg-white 
        shadow-lg flex items-center justify-center p-2
        transition-colors duration-300
        ${getBubbleClasses()}
      `}>
        <span className={`text-center font-bold text-sm md:text-base leading-tight select-none pointer-events-none ${isFocused ? 'text-amber-800' : isFromSource ? 'text-blue-700' : 'text-black/80 dark:text-white/80'}`}>
          {data.label}
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        className="opacity-0 !bg-transparent w-1 h-1 border-none"
      />
      <Handle
        type="source"
        position={Position.Top}
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        className="opacity-0 !bg-transparent w-1 h-1 border-none"
      />
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';
