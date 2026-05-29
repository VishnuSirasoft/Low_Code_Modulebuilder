export type ComponentType = 'text' | 'input' | 'button' | 'table' | 'form';

export interface BaseNode {
  id: string;
  type: ComponentType;
  parentId?: string | null;
}

export interface TextNode extends BaseNode {
  type: 'text';
  props: {
    text: string;
    variant: 'h1' | 'h2' | 'h3' | 'p';
    align: 'left' | 'center' | 'right';
    color?: string;
  };
}

export interface InputNode extends BaseNode {
  type: 'input';
  props: {
    label: string;
    placeholder: string;
    inputType: 'text' | 'number' | 'select';
    required: boolean;
    options?: { label: string; value: string }[];
  };
}

export interface ButtonNode extends BaseNode {
  type: 'button';
  props: {
    label: string;
    variant: 'primary' | 'secondary' | 'danger';
    actionType: 'submit' | 'reset' | 'click';
  };
}

export interface TableNode extends BaseNode {
  type: 'table';
  props: {
    columns: { header: string; accessor: string }[];
    dataSourceUrl: string;
  };
}

export interface FormNode extends BaseNode {
  type: 'form';
  props: {
    formLabel: string;
    submitUrl: string;
    submitText: string;
  };
}

export type CanvasNode = TextNode | InputNode | ButtonNode | TableNode | FormNode;

// Helper to determine if a node is an Input component
export function isInputNode(node: CanvasNode): node is InputNode {
  return node.type === 'input';
}

// Helper to determine if a node is a Form Container component
export function isFormNode(node: CanvasNode): node is FormNode {
  return node.type === 'form';
}

// Initial default props builder
export const createDefaultNode = (type: ComponentType, id: string, parentId: string | null = null): CanvasNode => {
  const base = { id, type, parentId };

  switch (type) {
    case 'text':
      return {
        ...base,
        type: 'text',
        props: {
          text: 'Heading / Paragraph Text',
          variant: 'p',
          align: 'left',
          color: 'var(--text-primary)',
        },
      };
    case 'input':
      return {
        ...base,
        type: 'input',
        props: {
          label: 'Text Input Label',
          placeholder: 'Enter text here...',
          inputType: 'text',
          required: false,
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
          ],
        },
      };
    case 'button':
      return {
        ...base,
        type: 'button',
        props: {
          label: 'Button Label',
          variant: 'primary',
          actionType: 'click',
        },
      };
    case 'table':
      return {
        ...base,
        type: 'table',
        props: {
          columns: [
            { header: 'ID', accessor: 'id' },
            { header: 'Name', accessor: 'name' },
            { header: 'Status', accessor: 'status' },
          ],
          dataSourceUrl: 'sample-users',
        },
      };
    case 'form':
      return {
        ...base,
        type: 'form',
        props: {
          formLabel: 'Form Container',
          submitUrl: 'https://api.example.com/submit',
          submitText: 'Submit Form',
        },
      };
  }
};
