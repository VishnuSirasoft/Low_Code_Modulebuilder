import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Type,
  TextCursorInput,
  MousePointerClick,
  Table2,
  Frame
} from 'lucide-react';
import type { ComponentType } from '../types/canvas';

interface PaletteItemProps {
  type: ComponentType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ type, label, description, icon }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      isPaletteItem: true,
      type,
    },
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: isDragging ? 0.4 : 1,
    }
    : {
      opacity: isDragging ? 0.4 : 1,
    };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="glass-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '10px',
        cursor: 'grab',
        userSelect: 'none',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        transition: 'border-color 0.2s, background-color 0.2s',
        ...style
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'rgba(99, 102, 241, 0.1)',
          color: 'var(--brand-primary)',
        }}
      >
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {label}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          {description}
        </span>
      </div>
    </div>
  );
};

export const Palette: React.FC = () => {
  const items: PaletteItemProps[] = [
    {
      type: 'text',
      label: 'Text / Heading',
      description: 'Heading, sub-heading, or static copy',
      icon: <Type size={18} />,
    },
    {
      type: 'input',
      label: 'Input Field',
      description: 'Text, number, or dropdown input',
      icon: <TextCursorInput size={18} />,
    },
    {
      type: 'button',
      label: 'Button',
      description: 'Submit forms or trigger actions',
      icon: <MousePointerClick size={18} />,
    },
    {
      type: 'table',
      label: 'Data Table',
      description: 'Render rows from a data source',
      icon: <Table2 size={18} />,
    },
    {
      type: 'form',
      label: 'Form Container',
      description: 'Group and validate inputs in a form',
      icon: <Frame size={18} />,
    },
  ];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Component Palette
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Drag components from here onto the canvas grid or inside a form container.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item) => (
          <PaletteItem key={item.type} {...item} />
        ))}
      </div>
    </div>
  );
};
