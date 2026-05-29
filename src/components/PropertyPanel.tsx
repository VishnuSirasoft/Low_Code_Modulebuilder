import React, { useEffect, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Trash2, 
  Plus, 
  Settings, 
  Info,
  Sliders
} from 'lucide-react';
import { useCanvas } from '../contexts/CanvasContext';
import { useBuilderStore } from '../store/useBuilderStore';

// ==========================================
// 1. ZOD VALIDATION SCHEMAS FOR EACH TYPE
// ==========================================

const textSchema = z.object({
  width: z.enum(['100', '50', '35', '33']).optional(),
  text: z.string().min(1, 'Text is required'),
  variant: z.enum(['h1', 'h2', 'h3', 'p']),
  align: z.enum(['left', 'center', 'right']).optional(),
  color: z.string().optional(),
});

const inputOptionSchema = z.object({
  label: z.string().min(1, 'Label required'),
  value: z.string().min(1, 'Value required'),
});

const inputSchema = z.object({
  width: z.enum(['100', '50', '35', '33']).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  label: z.string().min(1, 'Label is required'),
  placeholder: z.string().optional(),
  inputType: z.enum(['text', 'number', 'select']),
  required: z.boolean(),
  options: z.array(inputOptionSchema).optional(),
});

const buttonSchema = z.object({
  width: z.enum(['100', '50', '35', '33']).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  label: z.string().min(1, 'Label is required'),
  variant: z.enum(['primary', 'secondary', 'danger']),
  actionType: z.enum(['submit', 'reset', 'click']),
});

const tableColumnSchema = z.object({
  header: z.string().min(1, 'Header required'),
  accessor: z.string().min(1, 'Accessor required'),
});

const tableSchema = z.object({
  width: z.enum(['100', '50', '35', '33']).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  columns: z.array(tableColumnSchema).min(1, 'At least one column is required'),
  dataSourceUrl: z.string().min(1, 'Data source is required'),
});

const formSchema = z.object({
  width: z.enum(['100', '50', '35', '33']).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  formLabel: z.string().min(1, 'Form Label is required'),
  submitText: z.string().min(1, 'Submit text is required'),
  submitUrl: z.string().min(1, 'Submit URL is required'),
});

type FormValues = z.infer<
  | typeof textSchema 
  | typeof inputSchema 
  | typeof buttonSchema 
  | typeof tableSchema 
  | typeof formSchema
>;

// ==========================================
// 2. MAIN PROPERTY PANEL SIDEBAR COMPONENT
// ==========================================

export const PropertyPanel: React.FC = () => {
  const { nodes, updateProps } = useCanvas();
  const selectedNodeId = useBuilderStore(state => state.selectedNodeId);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const [, startTransition] = useTransition();

  // Determine Zod Schema dynamically
  const getSchemaForNode = (type: string) => {
    switch (type) {
      case 'text': return textSchema;
      case 'input': return inputSchema;
      case 'button': return buttonSchema;
      case 'table': return tableSchema;
      case 'form': return formSchema;
      default: return z.any();
    }
  };

  // Setup form
  const {
    register,
    control,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: selectedNode ? zodResolver(getSchemaForNode(selectedNode.type)) : undefined,
    defaultValues: selectedNode?.props || {},
  });

  const fieldErrors = errors as any;

  // Watch fields for live updates
  const watchedFields = watch();

  // Reset form whenever selected node changes
  useEffect(() => {
    if (selectedNode) {
      reset(selectedNode.props);
    }
  }, [selectedNodeId, reset]);

  // Synchronize watched form edits to the canvas with useTransition performance optimizations
  useEffect(() => {
    if (!selectedNodeId || !selectedNode) return;
    
    // Check if watched fields match node's current props to prevent infinite render loops
    const hasPropsChanged = JSON.stringify(watchedFields) !== JSON.stringify(selectedNode.props);
    if (!hasPropsChanged) return;

    // Use transition to avoid blocking UI keypress inputs
    startTransition(() => {
      updateProps(selectedNodeId, watchedFields);
    });
  }, [watchedFields, selectedNodeId, updateProps]);

  // Options dynamic array (for Inputs with select type)
  const { 
    fields: optionFields, 
    append: appendOption, 
    remove: removeOption 
  } = useFieldArray({
    control,
    name: 'options' as never,
  });

  // Columns dynamic array (for Tables)
  const { 
    fields: columnFields, 
    append: appendColumn, 
    remove: removeColumn 
  } = useFieldArray({
    control,
    name: 'columns' as never,
  });

  if (!selectedNode) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '16px',
          height: '100%',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}>
          <Sliders size={20} />
        </div>
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>
            No Component Selected
          </h4>
          <p style={{ fontSize: '0.75rem', maxWidth: '200px', lineHeight: 1.5 }}>
            Click on any component on the canvas to configure its dynamic properties here.
          </p>
        </div>
      </div>
    );
  }

  const { type, id } = selectedNode;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Property Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        <Settings size={18} style={{ color: 'var(--brand-secondary)' }} />
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Properties Editor
          </h3>
          <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            ID: {id.slice(0, 8)}... ({type.toUpperCase()})
          </span>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* GLOBAL COMPONENT WIDTH CONTROL */}
        <div>
          <label>Layout Width</label>
          <select {...register('width' as any)}>
            <option value="100">Full Width (100%)</option>
            <option value="50">Half Width (50%)</option>
            <option value="35">Centered Custom (35%)</option>
            <option value="33">One-Third Width (33%)</option>
          </select>
        </div>

        {/* GLOBAL COMPONENT ALIGNMENT CONTROL */}
        <div>
          <label>Horizontal Alignment</label>
          <select {...register('align' as any)}>
            <option value="left">Left Aligned</option>
            <option value="center">Centered</option>
            <option value="right">Right Aligned</option>
          </select>
        </div>
        
        {/* TEXT SPECIFIC FIELDS */}
        {type === 'text' && (
          <>
            <div>
              <label>Text Content</label>
              <textarea 
                rows={3} 
                {...register('text')} 
                placeholder="Enter heading or description text..."
              />
              {fieldErrors.text && <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)' }}>{fieldErrors.text.message as string}</span>}
            </div>

            <div>
              <label>Text Variant</label>
              <select {...register('variant')}>
                <option value="h1">Header 1 (1.8rem)</option>
                <option value="h2">Header 2 (1.4rem)</option>
                <option value="h3">Header 3 (1.1rem)</option>
                <option value="p">Paragraph (0.9rem)</option>
              </select>
            </div>

            <div>
              <label>Text Color</label>
              <input 
                type="text" 
                {...register('color')} 
                placeholder="e.g. #ff007f or var(--text-primary)"
              />
            </div>
          </>
        )}

        {/* INPUT SPECIFIC FIELDS */}
        {type === 'input' && (
          <>
            <div>
              <label>Label</label>
              <input type="text" {...register('label')} placeholder="Enter label..." />
              {fieldErrors.label && <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)' }}>{fieldErrors.label.message as string}</span>}
            </div>

            <div>
              <label>Placeholder</label>
              <input type="text" {...register('placeholder')} placeholder="Enter placeholder text..." />
            </div>

            <div>
              <label>Input Type</label>
              <select {...register('inputType')}>
                <option value="text">Text Input</option>
                <option value="number">Number Input</option>
                <option value="select">Dropdown Select</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              <input 
                type="checkbox" 
                id="required-prop"
                {...register('required')} 
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor="required-prop" style={{ margin: 0, cursor: 'pointer', textTransform: 'none' }}>
                Mark field as Required
              </label>
            </div>

            {/* DYNAMIC FIELD ARRAY: Select Options */}
            {(watchedFields as any).inputType === 'select' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
                  <label style={{ margin: 0 }}>Dropdown Options</label>
                  <button
                    type="button"
                    onClick={() => appendOption({ label: 'New Option', value: 'new_opt' })}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}
                  >
                    <Plus size={10} /> Add
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {optionFields.map((field, index) => (
                    <div key={field.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        {...register(`options.${index}.label` as const)} 
                        placeholder="Label" 
                        style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                      />
                      <input 
                        type="text" 
                        {...register(`options.${index}.value` as const)} 
                        placeholder="Value" 
                        style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* BUTTON SPECIFIC FIELDS */}
        {type === 'button' && (
          <>
            <div>
              <label>Button Label</label>
              <input type="text" {...register('label')} placeholder="Enter label..." />
              {fieldErrors.label && <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)' }}>{fieldErrors.label.message as string}</span>}
            </div>

            <div>
              <label>Button Variant</label>
              <select {...register('variant')}>
                <option value="primary">Primary (Indigo)</option>
                <option value="secondary">Secondary (Glass)</option>
                <option value="danger">Danger (Red)</option>
              </select>
            </div>

            <div>
              <label>Action Type</label>
              <select {...register('actionType')}>
                <option value="click">Default (Click Event)</option>
                <option value="submit">Submit Form</option>
                <option value="reset">Reset Form</option>
              </select>
            </div>
          </>
        )}

        {/* TABLE SPECIFIC FIELDS */}
        {type === 'table' && (
          <>
            <div>
              <label>Data Source URL</label>
              <select {...register('dataSourceUrl')}>
                <option value="sample-users">Users Directory (Sample)</option>
                <option value="sample-products">Product Inventory (Sample)</option>
                <option value="sample-orders">Order Logs (Sample)</option>
              </select>
            </div>

            {/* DYNAMIC FIELD ARRAY: Table Columns */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
                <label style={{ margin: 0 }}>Table Columns</label>
                <button
                  type="button"
                  onClick={() => appendColumn({ header: 'Col Header', accessor: 'col_key' })}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}
                >
                  <Plus size={10} /> Add
                </button>
              </div>

              {fieldErrors.columns && <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)' }}>{fieldErrors.columns.message as string}</span>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {columnFields.map((field, index) => (
                  <div key={field.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      {...register(`columns.${index}.header` as const)} 
                      placeholder="Header Name" 
                      style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                    />
                    <input 
                      type="text" 
                      {...register(`columns.${index}.accessor` as const)} 
                      placeholder="JSON Accessor" 
                      style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                    />
                    <button
                      type="button"
                      disabled={columnFields.length <= 1}
                      onClick={() => removeColumn(index)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* FORM CONTAINER SPECIFIC FIELDS */}
        {type === 'form' && (
          <>
            <div>
              <label>Form Title</label>
              <input type="text" {...register('formLabel')} placeholder="Enter title..." />
              {fieldErrors.formLabel && <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)' }}>{fieldErrors.formLabel.message as string}</span>}
            </div>

            <div>
              <label>Submit Button Text</label>
              <input type="text" {...register('submitText')} placeholder="Submit Button label..." />
              {fieldErrors.submitText && <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)' }}>{fieldErrors.submitText.message as string}</span>}
            </div>

            <div>
              <label>Mock API Endpoint URL</label>
              <input type="text" {...register('submitUrl')} placeholder="https://api.domain.com/endpoint" />
              {fieldErrors.submitUrl && <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)' }}>{fieldErrors.submitUrl.message as string}</span>}
            </div>
          </>
        )}

      </form>

      {/* Info Tip */}
      <div 
        style={{
          marginTop: 'auto',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '8px',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
        }}
      >
        <Info size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
        <span>
          Properties sync in real-time. editted fields immediately update the canvas rendering.
        </span>
      </div>
    </div>
  );
};
