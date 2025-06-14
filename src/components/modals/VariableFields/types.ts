export interface VariableFieldDefinition {
  offset: number;
  size: 1 | 2 | 3;
  name: string;
  description: string;
  type: 'simple' | 'bitmask' | 'timer' | 'text' | 'unknown';
  bitDescriptions?: string[];
  min?: number;
  max?: number;
  length?: number; // For text fields, this is the byte length
}

export interface VariableFieldProps {
  variable: VariableFieldDefinition;
  value: number;
  onChange: (value: number) => void;
  isChanged: boolean;
  searchQuery?: string;
}

export interface TextVariableFieldProps {
  variable: VariableFieldDefinition;
  value: Uint8Array;
  onChange: (value: Uint8Array) => void;
  isChanged: boolean;
  searchQuery?: string;
}
