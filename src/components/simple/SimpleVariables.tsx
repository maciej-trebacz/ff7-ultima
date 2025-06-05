import { useState } from 'react';
import NumericField from './NumericField';
import BitmaskField from './BitmaskField';
import { banks, SaveVarDefinition } from '@/data/saveBanks';
import { Input } from '@/components/ui/input';
import { FF7 } from '@/useFF7';

interface SimpleVariablesProps {
  ff7: FF7;
  bank: number;
  variables: number[];
  reload: () => Promise<void>;
}

export default function SimpleVariables({ ff7, bank, variables, reload }: SimpleVariablesProps) {
  const defs = banks[bank];
  const [search, setSearch] = useState('');
  if (!defs) {
    return <div className="text-xs">No definitions for this bank.</div>;
  }

  const getValue = (def: SaveVarDefinition) => {
    if (def.length === 1) return variables[def.offset] || 0;
    const low = variables[def.offset] || 0;
    const high = variables[def.offset + 1] || 0;
    return low + (high << 8);
  };

  const setValue = async (def: SaveVarDefinition, value: number) => {
    if (def.length === 1) {
      await ff7.setVariable(bank, def.offset, value & 0xff);
    } else {
      await ff7.setVariable16(bank, def.offset, value & 0xffff);
    }
    await reload();
  };

  const filtered = defs.filter(d => d.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-2">
      <Input
        className="sticky top-0 z-10"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="max-h-[60vh] overflow-y-auto pr-2 mt-2 flex flex-col gap-3">
        {filtered.map(def => {
          const val = getValue(def);
          if (def.type === 'bitmask' && def.bits) {
            return (
              <BitmaskField
                key={def.offset}
                label={def.label}
                value={val}
                bits={def.bits}
                onChange={v => setValue(def, v)}
              />
            );
          }
          return (
            <NumericField
              key={def.offset}
              label={def.label}
              value={val}
              onChange={v => setValue(def, v)}
            />
          );
        })}
      </div>
    </div>
  );
}
