import React, { useMemo } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  CheckCircle, 
  AlertCircle,
  Table2,
  Lock
} from 'lucide-react';
import type { CanvasNode, InputNode } from '../types/canvas';
import { useCanvas } from '../contexts/CanvasContext';
import { mockDatasets } from '../utils/mockApi';
import { ErrorBoundary } from './ErrorBoundary';

// ==========================================
// 1. RUNTIME ZOD SCHEMA GENERATION COMPILER
// ==========================================

const compileZodSchema = (inputs: InputNode[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  inputs.forEach((input) => {
    // We use the ID or label as the field key. ID is safer as it is guaranteed unique.
    const key = input.id;
    let fieldSchema: z.ZodTypeAny = z.string();

    if (input.props.inputType === 'number') {
      // Coerce input values to numbers for number fields
      fieldSchema = z.coerce.number({ 
        message: `${input.props.label} must be a valid number` 
      });
    }

    if (input.props.required) {
      if (input.props.inputType === 'number') {
        // Must be a number greater than 0 or any valid number
        fieldSchema = (fieldSchema as z.ZodNumber).refine(val => !isNaN(val), {
          message: `${input.props.label} is required`,
        });
      } else {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${input.props.label} is required`);
      }
    } else {
      // Allow empty values if not required
      if (input.props.inputType === 'number') {
        fieldSchema = z.union([z.number(), z.nan(), z.string().length(0)]).transform((val) => {
          if (typeof val === 'number') return isNaN(val) ? undefined : val;
          return undefined;
        }).optional();
      } else {
        fieldSchema = fieldSchema.optional().or(z.literal(''));
      }
    }

    shape[key] = fieldSchema;
  });

  return z.object(shape);
};

// ==========================================
// 2. RENDERING COMPONENT IMPLEMENTATIONS IN PREVIEW MODE
// ==========================================

const TextPreview: React.FC<{ node: CanvasNode }> = ({ node }) => {
  if (node.type !== 'text') return null;
  const { text, variant, align, color } = node.props;

  const style: React.CSSProperties = {
    textAlign: align,
    color: color || 'var(--text-primary)',
  };

  switch (variant) {
    case 'h1': return <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '12px 0', ...style }}>{text}</h1>;
    case 'h2': return <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '10px 0', ...style }}>{text}</h2>;
    case 'h3': return <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '8px 0', ...style }}>{text}</h3>;
    case 'p':
    default:
      return <p style={{ fontSize: '0.95rem', lineHeight: 1.6, ...style }}>{text}</p>;
  }
};

const InputPreview: React.FC<{ node: CanvasNode }> = ({ node }) => {
  if (node.type !== 'input') return null;
  const { label, placeholder, inputType, required, options = [] } = node.props;
  
  // Try to use Form Context if rendered inside a Form Container
  let formContext;
  try {
    formContext = useFormContext();
  } catch {
    formContext = null;
  }

  const { register, formState: { errors } = { errors: {} as Record<string, any> } } = (formContext || {}) as any;
  const error = errors?.[node.id];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
        {label}
        {required && <span style={{ color: 'var(--accent-red)' }}>*</span>}
      </label>
      
      {inputType === 'select' ? (
        <select 
          {...(register ? register(node.id) : {})} 
          style={{
            borderColor: error ? 'var(--accent-red)' : 'var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <option value="">{placeholder || 'Select option...'}</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input 
          type={inputType} 
          placeholder={placeholder}
          {...(register ? register(node.id) : {})}
          style={{
            borderColor: error ? 'var(--accent-red)' : 'var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        />
      )}
      
      {error && (
        <span style={{ fontSize: '0.72rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
          <AlertCircle size={12} />
          {error.message as string}
        </span>
      )}
    </div>
  );
};

const ButtonPreview: React.FC<{ node: CanvasNode }> = ({ node }) => {
  if (node.type !== 'button') return null;
  const { label, variant, actionType } = node.props;

  let btnStyle = 'btn btn-primary';
  if (variant === 'secondary') btnStyle = 'btn btn-secondary';
  if (variant === 'danger') btnStyle = 'btn btn-danger';

  return (
    <button 
      type={actionType === 'submit' ? 'submit' : actionType === 'reset' ? 'reset' : 'button'}
      className={btnStyle}
      onClick={() => {
        if (actionType === 'click') {
          alert(`Button "${label}" clicked!`);
        }
      }}
    >
      {label}
    </button>
  );
};

const TablePreview: React.FC<{ node: CanvasNode }> = ({ node }) => {
  if (node.type !== 'table') return null;
  const { columns = [], dataSourceUrl } = node.props;

  // Retrieve dataset dynamically
  const data = mockDatasets[dataSourceUrl] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        <Table2 size={14} style={{ color: 'var(--brand-secondary)' }} />
        <span>DYNAMIC DATASET: {dataSourceUrl.toUpperCase()}</span>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
              {columns.map((col, idx) => (
                <th key={idx} style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No records found in this dataset.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }} className="table-row-hover">
                  {columns.map((col, colIdx) => {
                    const val = row[col.accessor] ?? '—';
                    return (
                      <td key={colIdx} style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <style>{`
        .table-row-hover:hover {
          background: rgba(255,255,255,0.015);
        }
      `}</style>
    </div>
  );
};

// Form Container Engine with on-the-fly Zod schema compilation
const FormContainerPreview: React.FC<{ node: CanvasNode; children: React.ReactNode; allNodes: CanvasNode[] }> = ({ node, children, allNodes }) => {
  if (node.type !== 'form') return null;
  const { formLabel, submitText, submitUrl } = node.props;

  // Retrieve input components inside this form
  const inputChildren = useMemo(() => {
    return allNodes.filter(n => n.parentId === node.id && n.type === 'input') as InputNode[];
  }, [allNodes, node.id]);

  // Compile schema
  const compiledSchema = useMemo(() => {
    return compileZodSchema(inputChildren);
  }, [inputChildren]);

  // Setup form with the compiled schema resolver!
  const methods = useForm({
    resolver: zodResolver(compiledSchema),
  });

  const onSubmit = (data: any) => {
    // Print in beautiful console layout and alert
    console.log(`%c[Form Submitted] -> Target URL: ${submitUrl}`, 'color: #10b981; font-weight: bold;', data);
    alert(`✅ Form Submitted Successfully!\n\nEndpoint URL:\n${submitUrl}\n\nSubmitted Payload:\n${JSON.stringify(data, null, 2)}`);
  };

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={methods.handleSubmit(onSubmit)}
        style={{
          width: '100%',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          background: 'rgba(22, 28, 45, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
          <CheckCircle size={18} style={{ color: 'var(--brand-primary)' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {formLabel}
          </h4>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
          {children}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button type="submit" className="btn btn-primary">
            {submitText}
          </button>
          <button type="button" onClick={() => methods.reset()} className="btn btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

// Router
const PreviewComponentRouter: React.FC<{ node: CanvasNode; children?: React.ReactNode; allNodes: CanvasNode[] }> = ({ node, children, allNodes }) => {
  // Calculate component layout width
  const widthProp = node.props.width || '100';
  let flexStyle: React.CSSProperties = { width: '100%' };
  if (widthProp === '50') {
    flexStyle = { width: 'calc(50% - 8px)', flexGrow: 0, flexShrink: 0 };
  } else if (widthProp === '33') {
    flexStyle = { width: 'calc(33.33% - 11px)', flexGrow: 0, flexShrink: 0 };
  }

  const renderComponent = () => {
    switch (node.type) {
      case 'text': return <TextPreview node={node} />;
      case 'input': return <InputPreview node={node} />;
      case 'button': return <ButtonPreview node={node} />;
      case 'table': return <TablePreview node={node} />;
      case 'form': return <FormContainerPreview node={node} allNodes={allNodes}>{children}</FormContainerPreview>;
      default: return null;
    }
  };

  return (
    <div style={{ ...flexStyle, display: 'flex', flexDirection: 'column' }}>
      {renderComponent()}
    </div>
  );
};

// ==========================================
// 3. MAIN PREVIEW ENGINE RENDERING VIEWPORT
// ==========================================

export const Preview: React.FC = () => {
  const { nodes } = useCanvas();

  const rootNodes = useMemo(() => {
    return nodes.filter(node => !node.parentId);
  }, [nodes]);

  const renderFormChildren = (formId: string) => {
    const children = nodes.filter(node => node.parentId === formId);
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
        {children.map(child => (
          <ErrorBoundary key={child.id} componentName={child.type.toUpperCase() + ' (PREVIEW)'}>
            <PreviewComponentRouter node={child} allNodes={nodes} />
          </ErrorBoundary>
        ))}
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          height: '100%',
        }}
      >
        <div style={{ 
          width: '56px', 
          height: '56px', 
          borderRadius: '50%', 
          background: 'rgba(255,255,255,0.02)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '16px',
          color: 'var(--text-muted)'
        }}>
          <Lock size={20} />
        </div>
        <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
          No components to preview
        </h4>
        <p style={{ fontSize: '0.75rem', maxWidth: '240px', lineHeight: 1.5 }}>
          Go back to Edit Mode and drop some elements onto the canvas first.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="animate-fade-in"
      style={{
        flex: 1,
        padding: '40px 10%',
        overflowY: 'auto',
        height: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {rootNodes.map(node => (
        <ErrorBoundary key={node.id} componentName={node.type.toUpperCase() + ' (PREVIEW)'}>
          <PreviewComponentRouter node={node} allNodes={nodes}>
            {node.type === 'form' ? renderFormChildren(node.id) : undefined}
          </PreviewComponentRouter>
        </ErrorBoundary>
      ))}
    </div>
  );
};
