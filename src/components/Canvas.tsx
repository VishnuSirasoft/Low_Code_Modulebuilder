import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { 
  useSortable, 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Trash2, 
  Type, 
  TextCursorInput, 
  MousePointerClick, 
  Table2, 
  Frame, 
  Move 
} from 'lucide-react';
import type { CanvasNode, ComponentType } from '../types/canvas';
import { useCanvas } from '../contexts/CanvasContext';
import { useBuilderStore } from '../store/useBuilderStore';
import { ErrorBoundary } from './ErrorBoundary';

// Get icon corresponding to node type
export const getNodeIcon = (type: ComponentType, size = 16) => {
  switch (type) {
    case 'text': return <Type size={size} />;
    case 'input': return <TextCursorInput size={size} />;
    case 'button': return <MousePointerClick size={size} />;
    case 'table': return <Table2 size={size} />;
    case 'form': return <Frame size={size} />;
  }
};

// ==========================================
// 1. CANVAS ELEMENT INDIVIDUAL RENDERERS
// ==========================================

const TextRenderer: React.FC<{ node: CanvasNode }> = ({ node }) => {
  if (node.type !== 'text') return null;
  const { text, variant, align, color } = node.props;
  
  const alignStyle: React.CSSProperties = { textAlign: align };
  const customStyle: React.CSSProperties = { color: color || 'var(--text-primary)', ...alignStyle };

  switch (variant) {
    case 'h1': return <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', ...customStyle }}>{text}</h1>;
    case 'h2': return <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '6px 0', ...customStyle }}>{text}</h2>;
    case 'h3': return <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '6px 0', ...customStyle }}>{text}</h3>;
    case 'p':
    default:
      return <p style={{ fontSize: '0.9rem', lineHeight: 1.5, ...customStyle }}>{text}</p>;
  }
};

const InputRenderer: React.FC<{ node: CanvasNode }> = ({ node }) => {
  if (node.type !== 'input') return null;
  const { label, placeholder, inputType, required, options = [] } = node.props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {required && <span style={{ color: 'var(--accent-red)' }}>*</span>}
      </label>
      {inputType === 'select' ? (
        <select disabled style={{ cursor: 'default' }}>
          <option value="">{placeholder || 'Select option...'}</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input 
          type={inputType} 
          placeholder={placeholder} 
          disabled 
          style={{ cursor: 'default' }}
        />
      )}
    </div>
  );
};

const ButtonRenderer: React.FC<{ node: CanvasNode }> = ({ node }) => {
  if (node.type !== 'button') return null;
  const { label, variant } = node.props;

  let btnStyle = 'btn btn-primary';
  if (variant === 'secondary') btnStyle = 'btn btn-secondary';
  if (variant === 'danger') btnStyle = 'btn btn-danger';

  return (
    <button className={btnStyle} style={{ width: 'fit-content', pointerEvents: 'none' }}>
      {label}
    </button>
  );
};

const TableRenderer: React.FC<{ node: CanvasNode }> = ({ node }) => {
  if (node.type !== 'table') return null;
  const { columns = [] } = node.props;

  // Render dummy rows in edit mode
  const dummyRows = [
    { id: '1', name: 'Alexander Wright', status: 'Active' },
    { id: '2', name: 'Evelyn Hayes', status: 'Pending' },
  ];

  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
            {columns.map((col, idx) => (
              <th key={idx} style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dummyRows.map((row, rowIdx) => (
            <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {columns.map((col, colIdx) => {
                const val = (row as any)[col.accessor] || '—';
                return (
                  <td key={colIdx} style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Form Container Drop Zone
const FormContainerRenderer: React.FC<{ node: CanvasNode; children: React.ReactNode }> = ({ node, children }) => {
  if (node.type !== 'form') return null;
  const { formLabel, submitText } = node.props;

  const { setNodeRef, isOver } = useDroppable({
    id: `form-drop-${node.id}`,
    data: {
      isFormDrop: true,
      formId: node.id,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      style={{
        width: '100%',
        padding: '20px',
        borderRadius: '12px',
        border: isOver 
          ? '2px dashed var(--brand-primary)' 
          : '1.5px solid rgba(99, 102, 241, 0.2)',
        background: isOver 
          ? 'rgba(99, 102, 241, 0.05)' 
          : 'rgba(22, 28, 45, 0.2)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'var(--transition-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
        <Frame size={16} style={{ color: 'var(--brand-primary)' }} />
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {formLabel}
        </h4>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', minHeight: '60px' }}>
        {children}
      </div>

      <button className="btn btn-primary" style={{ width: 'fit-content', alignSelf: 'flex-start', marginTop: '4px', pointerEvents: 'none' }}>
        {submitText}
      </button>
    </div>
  );
};

// Component Router
const RenderComponent: React.FC<{ node: CanvasNode; children?: React.ReactNode }> = ({ node, children }) => {
  switch (node.type) {
    case 'text': return <TextRenderer node={node} />;
    case 'input': return <InputRenderer node={node} />;
    case 'button': return <ButtonRenderer node={node} />;
    case 'table': return <TableRenderer node={node} />;
    case 'form': return <FormContainerRenderer node={node}>{children}</FormContainerRenderer>;
    default: return null;
  }
};

// ==========================================
// 2. CANVAS ELEMENT WRAPPER WITH TOOLBARS
// ==========================================

interface CanvasItemWrapperProps {
  node: CanvasNode;
  children?: React.ReactNode;
}

const CanvasItemWrapper: React.FC<CanvasItemWrapperProps> = ({ node, children }) => {
  const { deleteNode } = useCanvas();
  const selectedNodeId = useBuilderStore(state => state.selectedNodeId);
  const setSelectedNodeId = useBuilderStore(state => state.setSelectedNodeId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: node.id,
    data: {
      isCanvasItem: true,
      node,
    }
  });

  const isSelected = selectedNodeId === node.id;

  // Calculate component layout width
  const widthProp = node.props.width || '100';
  let flexStyle: React.CSSProperties = { width: '100%' };
  if (widthProp === '50') {
    flexStyle = { width: 'calc(50% - 8px)', flexGrow: 0, flexShrink: 0 };
  } else if (widthProp === '35') {
    flexStyle = { width: 'calc(35% - 8px)', flexGrow: 0, flexShrink: 0 };
  } else if (widthProp === '33') {
    flexStyle = { width: 'calc(33.33% - 11px)', flexGrow: 0, flexShrink: 0 };
  }

  // Calculate component horizontal alignment layout margins
  const alignProp = node.props.align || 'left';
  let alignStyle: React.CSSProperties = {};
  if (alignProp === 'center') {
    alignStyle = { marginLeft: 'auto', marginRight: 'auto' };
  } else if (alignProp === 'right') {
    alignStyle = { marginLeft: 'auto', marginRight: 0 };
  } else if (alignProp === 'left' && widthProp !== '100') {
    alignStyle = { marginRight: 'auto', marginLeft: 0 };
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ? `${transition}, border-color 0.2s, box-shadow 0.2s` : 'border-color 0.2s, box-shadow 0.2s',
    opacity: isDragging ? 0.3 : 1,
    position: 'relative',
    borderRadius: '12px',
    border: isSelected 
      ? '1px solid var(--brand-primary)' 
      : '1px solid var(--border-subtle)',
    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'none',
    background: isSelected ? 'rgba(99, 102, 241, 0.02)' : 'rgba(255,255,255,0.01)',
    padding: node.type === 'form' ? '6px' : '16px',
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    ...flexStyle,
    ...alignStyle,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(node.id);
    if (isSelected) {
      setSelectedNodeId(null);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={handleSelect}
      className="canvas-node-wrapper"
    >
      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          color: 'var(--text-muted)',
          padding: '4px',
          borderRadius: '4px',
          alignSelf: node.type === 'form' ? 'flex-start' : 'center',
          marginTop: node.type === 'form' ? '12px' : 0,
        }}
        className="drag-handle"
      >
        <Move size={14} />
      </div>

      {/* Actual component render wrapper */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <ErrorBoundary componentName={node.type.toUpperCase()}>
          <RenderComponent node={node}>{children}</RenderComponent>
        </ErrorBoundary>
      </div>

      {/* Action Toolbar on Hover */}
      <div 
        style={{
          position: 'absolute',
          top: '-12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-dark)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '2px 6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 5,
        }}
        className="node-hover-toolbar"
      >
        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', paddingRight: '4px', borderRight: '1px solid var(--border-subtle)', marginRight: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
          {getNodeIcon(node.type, 10)}
          {node.type}
        </div>
        <button 
          onClick={handleDelete}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-red)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Delete element"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN CANVAS CONTAINER COMPONENT
// ==========================================

export const Canvas: React.FC = () => {
  const { nodes } = useCanvas();

  // Set up Root Canvas as a droppable target for new palette drags
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root-droppable',
    data: {
      isCanvasRoot: true,
    },
  });

  // Extract root elements (those that do not have a parent)
  const rootNodes = nodes.filter(node => !node.parentId);

  // Helper to render nested nodes for Form containers
  const renderFormChildren = (formId: string) => {
    const children = nodes.filter(node => node.parentId === formId);
    
    if (children.length === 0) {
      return (
        <div 
          style={{
            padding: '16px',
            borderRadius: '8px',
            border: '1px dashed var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            background: 'rgba(0,0,0,0.1)',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Form Container (Drop fields here)
        </div>
      );
    }

    return (
      <SortableContext items={children.map(n => n.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
          {children.map(child => (
            <CanvasItemWrapper key={child.id} node={child} />
          ))}
        </div>
      </SortableContext>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        padding: '30px',
        background: isOver ? 'rgba(99, 102, 241, 0.01)' : 'transparent',
        overflowY: 'auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'background-color 0.2s',
      }}
    >
      <style>{`
        .canvas-node-wrapper .node-hover-toolbar {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .canvas-node-wrapper:hover .node-hover-toolbar {
          opacity: 1;
          pointer-events: auto;
        }
        .canvas-node-wrapper:hover {
          border-color: var(--border-focus) !important;
        }
      `}</style>

      {rootNodes.length === 0 ? (
        <div 
          className="empty-state" 
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            background: isOver ? 'rgba(99, 102, 241, 0.03)' : 'rgba(255,255,255,0.005)',
            borderStyle: isOver ? 'solid' : 'dashed',
            borderColor: isOver ? 'var(--brand-primary)' : 'var(--border-subtle)',
          }}
        >
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'rgba(99, 102, 241, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '16px',
            color: 'var(--brand-primary)',
          }}>
            <Frame size={28} />
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Your canvas is empty
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: 1.5 }}>
            Drag components from the left sidebar and drop them here to start building your screen.
          </p>
        </div>
      ) : (
        <SortableContext items={rootNodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
            {rootNodes.map(node => (
              <CanvasItemWrapper key={node.id} node={node}>
                {node.type === 'form' ? renderFormChildren(node.id) : undefined}
              </CanvasItemWrapper>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
};
