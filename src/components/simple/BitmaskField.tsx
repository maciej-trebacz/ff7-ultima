import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BitDefinition } from '@/data/saveBanks';

interface BitmaskFieldProps {
  label: string;
  value: number;
  bits: BitDefinition[];
  onChange: (value: number) => Promise<void> | void;
}

export default function BitmaskField({ label, value, bits, onChange }: BitmaskFieldProps) {
  const handleToggle = async (mask: number, checked: boolean) => {
    let newVal = value;
    if (checked) newVal |= mask; else newVal &= ~mask;
    await onChange(newVal);
  };

  return (
    <div className="py-2">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="ml-2 mt-1 flex flex-col gap-1">
        {bits.map(bit => (
          <label key={bit.mask} className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={Boolean(value & bit.mask)}
              onCheckedChange={(checked) => handleToggle(bit.mask, !!checked)}
            />
            <span>{bit.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
