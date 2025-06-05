import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { EditPopover } from '@/components/EditPopover';

interface NumericFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => Promise<void> | void;
}

export default function NumericField({ label, value, onChange }: NumericFieldProps) {
  const [open, setOpen] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleSubmit = async () => {
    const num = parseInt(editValue);
    if (!isNaN(num)) {
      await onChange(num);
    }
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-between py-1 text-xs cursor-pointer hover:text-primary" onClick={() => setOpen(true)}>
      <Label className="mr-2">{label}</Label>
      <EditPopover
        open={open}
        onOpenChange={setOpen}
        value={editValue}
        onValueChange={setEditValue}
        onSubmit={handleSubmit}
      >
        <span data-trigger="true">{value}</span>
      </EditPopover>
    </div>
  );
}
