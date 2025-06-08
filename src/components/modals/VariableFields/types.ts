export interface VariableFieldDefinition {
  offset: number;
  size: 1 | 2 | 3;
  name: string;
  description: string;
  type: 'simple' | 'bitmask' | 'timer' | 'unknown';
  bitDescriptions?: string[];
  min?: number;
  max?: number;
}

export interface VariableFieldProps {
  variable: VariableFieldDefinition;
  value: number;
  onChange: (value: number) => void;
  isChanged: boolean;
}
