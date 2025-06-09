import { useContext, useState, useEffect, useCallback } from 'react';
import { useFF7Context } from '@/FF7Context';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditPopover } from "@/components/EditPopover";
import { PartyMember } from '@/types';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { FF7 } from "@/useFF7";

// Helper component to reduce boilerplate for EditPopover
const EditableStat = ({
  label,
  value,
  onSave,
  type = "number",
  min,
  max,
  disabled = false,
  className
}: {
  label: string;
  value: string | number;
  onSave: (newValue: string | number) => void;
  type?: "text" | "number";
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const uniqueId = `editable-stat-${label.toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleSubmit = useCallback(() => {
    if (disabled) return;
    let finalValue: string | number = editValue;
    if (type === "number") {
      const numValue = Number(editValue);
      if (isNaN(numValue)) return; // Or show error
      if (min !== undefined && numValue < min) finalValue = min;
      else if (max !== undefined && numValue > max) finalValue = max;
      else finalValue = numValue;
    }
    onSave(finalValue);
    setPopoverOpen(false);
  }, [disabled, editValue, type, min, max, onSave]);

  return (
    <div 
      className={`flex items-center justify-between py-1 ${className} ${disabled ? 'cursor-default text-muted-foreground' : 'cursor-pointer hover:text-primary'}`}
      onClick={() => !disabled && setPopoverOpen(true)}
    >
      <Label htmlFor={uniqueId} className="text-xs whitespace-nowrap mr-2">{label}</Label>
      <EditPopover
        open={popoverOpen && !disabled}
        onOpenChange={setPopoverOpen}
        value={editValue}
        onValueChange={setEditValue}
        onSubmit={handleSubmit}
      >
        <span
          id={uniqueId}
          className="text-xs text-right"
          data-trigger="true"
        >
          {value}
        </span>
      </EditPopover>
    </div>
  );
};

// Compact editor for limit break uses
const LimitUseEditor = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleSubmit = useCallback(() => {
    const numValue = Number(editValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue);
    }
    setPopoverOpen(false);
  }, [editValue, onChange]);

  return (
    <EditPopover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      value={editValue}
      onValueChange={setEditValue}
      onSubmit={handleSubmit}
    >
      <span
        className="text-sm font-medium text-center cursor-pointer hover:text-primary bg-gray-800 rounded px-2 py-1 w-12 inline-block"
        data-trigger="true"
        onClick={() => setPopoverOpen(true)}
      >
        {value}
      </span>
    </EditPopover>
  );
};


export function Party({ ff7 }: { ff7: FF7 }) {
  const { gameState, gameData } = useFF7Context();
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<PartyMember | null>(null);

  useEffect(() => {
    if (gameState?.partyMembers && gameState.partyMembers.length > 0) {
      const validSelectedId = gameState.partyMembers.find((m: PartyMember) => m.id === selectedCharId);
      if (selectedCharId === null || !validSelectedId) {
        setSelectedCharId(gameState.partyMembers[0].id);
      }
    } else {
      setSelectedCharId(null);
    }
  }, [gameState?.partyMembers, selectedCharId]);

  useEffect(() => {
    if (selectedCharId !== null && gameState?.partyMembers) {
      setCurrentCharacter(gameState.partyMembers.find((m: PartyMember) => m.id === selectedCharId) || null);
    } else {
      setCurrentCharacter(null);
    }
  }, [selectedCharId, gameState?.partyMembers]);

  const handleStatChange = useCallback(async (statName: keyof PartyMember, value: string | number) => {
    if (currentCharacter === null || !ff7) return;

    // Ensure numeric values are numbers
    const partyMemberSchema = {
      id: 'number', name: 'string', level: 'number', strength: 'number', vitality: 'number', magic: 'number', spirit: 'number', dexterity: 'number', luck: 'number',
      strength_bonus: 'number', vitality_bonus: 'number', magic_bonus: 'number', spirit_bonus: 'number', dexterity_bonus: 'number', luck_bonus: 'number',
      limit_level: 'number', status: 'number', hp: 'number', max_hp: 'number', mp: 'number', max_mp: 'number', limit: 'number', exp: 'number',
      weapon: 'number', armor: 'number', accessory: 'number', limit_skills: 'number', kills: 'number',
      limit_1_1_uses: 'number', limit_2_1_uses: 'number', limit_3_1_uses: 'number',
      exp_to_next_level: 'number'
    };

    let processedValue = value;
    if (partyMemberSchema[statName as keyof typeof partyMemberSchema] === 'number' && typeof value === 'string') {
      processedValue = Number(value);
      if (isNaN(processedValue as number)) {
        console.error(`Invalid number format for ${statName}: ${value}`);
        return; // Or show error to user
      }
    }

    await ff7.updatePartyMember(currentCharacter.id, statName, processedValue);
  }, [currentCharacter, ff7]);

  if (!gameState || !gameState.partyMembers || gameState.partyMembers.length === 0) {
    return <Card>
      <CardContent className="p-6 text-center">
        Launch the game to see party data.
      </CardContent>
    </Card>              
  }

  if (!currentCharacter) {
    return <div className="p-4 text-sm text-muted-foreground">Loading character data...</div>;
  }

  return (
    <div className="space-y-2">
      {currentCharacter && (
        <div className="grid grid-cols-2 gap-2">
          {/* General & Core Stats */}
            <Card>
              <CardHeader className="p-3 py-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Choose member:</Label>
                  <Select
                    value={selectedCharId !== null ? String(selectedCharId) : undefined}
                    onValueChange={(val) => setSelectedCharId(Number(val))}
                  >
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="Select a character">
                        {currentCharacter.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {gameState.partyMembers.map((member: PartyMember) => (
                        <SelectItem key={member.id} value={String(member.id)} className="text-sm">
                          {member.name} (Lv. {member.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-0.5">
                <EditableStat label="Name" value={currentCharacter.name} onSave={(v) => handleStatChange('name', v as string)} type="text" />
                <EditableStat label="Level" value={currentCharacter.level} onSave={(v) => handleStatChange('level', v as number)} min={1} max={99} />
                <div className="grid grid-cols-2 gap-x-3">
                  <EditableStat label="Cur. HP" value={currentCharacter.hp} onSave={(v) => handleStatChange('hp', v as number)} min={0} max={9999} />
                  <EditableStat label="Base HP" value={currentCharacter.base_hp} onSave={(v) => handleStatChange('base_hp', v as number)} min={1} max={9999} />
                </div>
                <div className="grid grid-cols-2 gap-x-3">
                  <EditableStat label="Cur. MP" value={currentCharacter.mp} onSave={(v) => handleStatChange('mp', v as number)} min={0} max={999} />
                  <EditableStat label="Base MP" value={currentCharacter.base_mp} onSave={(v) => handleStatChange('base_mp', v as number)} min={0} max={999} />
                </div>
                <EditableStat label="Experience" value={currentCharacter.exp} onSave={(v) => handleStatChange('exp', v as number)} min={0} />
                <EditableStat 
                  label="Next Level EXP" 
                  value={currentCharacter.exp_to_next_level} 
                  onSave={(v) => handleStatChange('exp_to_next_level', v as number)} 
                  min={0}
                />
                <EditableStat label="Kills" value={currentCharacter.kills} onSave={(v) => handleStatChange('kills', v as number)} min={0} />
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="p-3 pb-0"><CardTitle className="text-sm">Stats</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-[1fr,auto] gap-x-4">
                  {/* Stats Names */}
                  <div className="space-y-2 text-xs font-semibold">
                    <div className="h-4"></div> {/* Spacer for header alignment */}
                    <div>Strength</div>
                    <div>Dexterity</div>
                    <div>Vitality</div>
                    <div>Magic</div>
                    <div>Spirit</div>
                    <div>Luck</div>
                  </div>
                  {/* Base/Bonus Values */}
                  <div className="space-y-0 text-xs min-w-[100px]">
                    <div className="text-xs text-muted-foreground text-right mb-1">Base / Sources</div>
                    <div className="flex items-center justify-end space-x-1">
                      <EditableStat 
                        label="" 
                        value={currentCharacter.strength} 
                        onSave={(v) => handleStatChange('strength', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                      <span className="text-muted-foreground">/</span>
                      <EditableStat 
                        label="" 
                        value={currentCharacter.strength_bonus} 
                        onSave={(v) => handleStatChange('strength_bonus', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      <EditableStat 
                        label="" 
                        value={currentCharacter.dexterity} 
                        onSave={(v) => handleStatChange('dexterity', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                      <span className="text-muted-foreground">/</span>
                      <EditableStat 
                        label="" 
                        value={currentCharacter.dexterity_bonus} 
                        onSave={(v) => handleStatChange('dexterity_bonus', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      <EditableStat 
                        label="" 
                        value={currentCharacter.vitality} 
                        onSave={(v) => handleStatChange('vitality', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                      <span className="text-muted-foreground">/</span>
                      <EditableStat 
                        label="" 
                        value={currentCharacter.vitality_bonus} 
                        onSave={(v) => handleStatChange('vitality_bonus', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      <EditableStat 
                        label="" 
                        value={currentCharacter.magic} 
                        onSave={(v) => handleStatChange('magic', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                      <span className="text-muted-foreground">/</span>
                      <EditableStat 
                        label="" 
                        value={currentCharacter.magic_bonus} 
                        onSave={(v) => handleStatChange('magic_bonus', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      <EditableStat 
                        label="" 
                        value={currentCharacter.spirit} 
                        onSave={(v) => handleStatChange('spirit', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                      <span className="text-muted-foreground">/</span>
                      <EditableStat 
                        label="" 
                        value={currentCharacter.spirit_bonus} 
                        onSave={(v) => handleStatChange('spirit_bonus', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      <EditableStat 
                        label="" 
                        value={currentCharacter.luck} 
                        onSave={(v) => handleStatChange('luck', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                      <span className="text-muted-foreground">/</span>
                      <EditableStat 
                        label="" 
                        value={currentCharacter.luck_bonus} 
                        onSave={(v) => handleStatChange('luck_bonus', v as number)} 
                        min={0} 
                        max={255}
                        className="!py-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-center text-muted-foreground mt-2">"Base" means raw stats before applying bonuses from equipment and materia.</div>
              </CardContent>
            </Card>

            {/* Limits */}
            <Card>
              <CardHeader className="p-3"><CardTitle className="text-sm">Limits</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0 space-y-0.5">
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs whitespace-nowrap">Current Level</Label>
                  <div className="flex bg-slate-800 rounded-md p-0.5 w-32">
                    {[1, 2, 3, 4].map((level) => (
                      <Button
                        key={level}
                        type="button"
                        variant={currentCharacter.limit_level === level ? "default" : "ghost"}
                        size="sm"
                        className={`flex-1 h-6 px-0 text-xs rounded-sm ${
                          currentCharacter.limit_level === level
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-slate-700 text-muted-foreground"
                        }`}
                        onClick={() => handleStatChange('limit_level', level)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 py-2 text-xs">
                  <div className="whitespace-nowrap">Bar</div>
                  <div className="flex items-center w-full">
                    <Slider
                      value={[currentCharacter.limit]}
                      onValueChange={async (value) => {
                        await handleStatChange('limit', value[0]);
                      }}
                      min={0}
                      max={255}
                      step={1}
                      className="w-full"
                    />
                    <span className="ml-2 text-xs min-w-8 text-right">{Math.round((currentCharacter.limit / 255) * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs whitespace-nowrap">Learned</Label>
                  <div className="flex flex-col">
                    <div className="grid grid-cols-4 gap-x-0 gap-y-0.5 bg-slate-800 rounded-md p-0.5 w-32">
                      {[
                        { id: 'limit-1-1', label: '1-1', bitmask: 0x0001 },
                        { id: 'limit-2-1', label: '2-1', bitmask: 0x0008 },
                        { id: 'limit-3-1', label: '3-1', bitmask: 0x0040 },
                        { id: 'limit-4', label: '4', bitmask: 0x0200 },
                        { id: 'limit-1-2', label: '1-2', bitmask: 0x0002 },
                        { id: 'limit-2-2', label: '2-2', bitmask: 0x0010 },
                        { id: 'limit-3-2', label: '3-2', bitmask: 0x0080 }
                      ].map(limit => (
                        <Button
                          key={limit.id}
                          type="button"
                          variant={Boolean(currentCharacter.limit_skills & limit.bitmask) ? "default" : "ghost"}
                          size="sm"
                          className={`flex-1 h-6 px-0 mx-[1px] text-xs rounded-sm ${
                            Boolean(currentCharacter.limit_skills & limit.bitmask)
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-slate-700 text-muted-foreground"
                          }`}
                          onClick={() => {
                            const isActive = Boolean(currentCharacter.limit_skills & limit.bitmask);
                            const newValue = isActive
                              ? currentCharacter.limit_skills & ~limit.bitmask
                              : currentCharacter.limit_skills | limit.bitmask;
                            handleStatChange('limit_skills', newValue);
                          }}
                        >
                          {limit.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-semibold block mb-1">Uses</Label>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="flex flex-col items-center">
                      <Label className="text-xs mb-1 text-center">Lv. 1</Label>
                      <LimitUseEditor
                        value={currentCharacter.limit_1_1_uses}
                        onChange={(value) => handleStatChange('limit_1_1_uses', value)}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <Label className="text-xs mb-1 text-center">Lv. 2</Label>
                      <LimitUseEditor
                        value={currentCharacter.limit_2_1_uses}
                        onChange={(value) => handleStatChange('limit_2_1_uses', value)}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <Label className="text-xs mb-1 text-center">Lv. 3</Label>
                      <LimitUseEditor
                        value={currentCharacter.limit_3_1_uses}
                        onChange={(value) => handleStatChange('limit_3_1_uses', value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment & Status container */}
            <div className="flex flex-col gap-2 h-full">
              {/* Equipment */}
              <Card className="flex-1">
                <CardHeader className="p-3"><CardTitle className="text-sm">Equipment</CardTitle></CardHeader>
                <CardContent className="p-3 pt-0 space-y-0">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs whitespace-nowrap">Weapon</Label>
                    <Select
                      value={String(currentCharacter.weapon)}
                      onValueChange={(value) => handleStatChange('weapon', Number(value))}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue>
                          {currentCharacter.weapon === 0xFF
                            ? "Not equipped"
                            : (gameData.itemNames && gameData.itemNames[currentCharacter.weapon + 0x80]
                              ? gameData.itemNames[currentCharacter.weapon + 0x80]
                              : `ID: ${currentCharacter.weapon}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {gameData.itemNames && [...Array(128)].map((_, i) => {
                          const index = i + 0x80;
                          const name = gameData.itemNames[index];
                          return name && (
                            <SelectItem key={i} value={String(i)} className="text-xs">
                              {name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs whitespace-nowrap">Armor</Label>
                    <Select
                      value={String(currentCharacter.armor)}
                      onValueChange={(value) => handleStatChange('armor', Number(value))}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue>
                          {currentCharacter.armor === 0xFF
                            ? "Not equipped"
                            : (gameData.itemNames && gameData.itemNames[currentCharacter.armor + 0x100]
                              ? gameData.itemNames[currentCharacter.armor + 0x100]
                              : `ID: ${currentCharacter.armor}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {gameData.itemNames && [...Array(32)].map((_, i) => {
                          const index = i + 0x100;
                          const name = gameData.itemNames[index];
                          return name && (
                            <SelectItem key={i} value={String(i)} className="text-xs">
                              {name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs whitespace-nowrap">Accessory</Label>
                    <Select
                      value={String(currentCharacter.accessory)}
                      onValueChange={(value) => handleStatChange('accessory', Number(value))}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue>
                          {currentCharacter.accessory === 0xFF
                            ? "Not equipped"
                            : (gameData.itemNames && gameData.itemNames[currentCharacter.accessory + 0x120]
                              ? gameData.itemNames[currentCharacter.accessory + 0x120]
                              : `ID: ${currentCharacter.accessory}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="255" className="text-xs">Not equipped</SelectItem>
                        {gameData.itemNames && [...Array(32)].map((_, i) => {
                          const index = i + 0x120;
                          const name = gameData.itemNames[index];
                          return name && (
                            <SelectItem key={i} value={String(i)} className="text-xs">
                              {name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Status & Order */}
              <Card className="flex-1">
                <CardHeader className="p-3"><CardTitle className="text-sm">Status & Order</CardTitle></CardHeader>
                <CardContent className="p-3 pt-0 space-y-0.5">
                  <div className="flex items-center space-x-5 py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-sadness"
                        checked={Boolean(currentCharacter.status & 0x10)}
                        onCheckedChange={(checked) => {
                          let newStatus = currentCharacter.status;
                          if (checked) {
                            // Turn on Sadness and turn off Fury
                            newStatus = (newStatus & ~0x20) | 0x10;
                          } else {
                            // Just turn off Sadness
                            newStatus = newStatus & ~0x10;
                          }
                          handleStatChange('status', newStatus);
                        }}
                      />
                      <Label htmlFor="status-sadness" className="text-xs">Sadness</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-fury"
                        checked={Boolean(currentCharacter.status & 0x20)}
                        onCheckedChange={(checked) => {
                          let newStatus = currentCharacter.status;
                          if (checked) {
                            // Turn on Fury and turn off Sadness
                            newStatus = (newStatus & ~0x10) | 0x20;
                          } else {
                            // Just turn off Fury
                            newStatus = newStatus & ~0x20;
                          }
                          handleStatChange('status', newStatus);
                        }}
                      />
                      <Label htmlFor="status-fury" className="text-xs">Fury</Label>
                    </div>
                  </div>
                  <div className="flex items-center py-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="back-row"
                        checked={currentCharacter.order === 0xFE}
                        onCheckedChange={(checked) => {
                          const newOrder = checked ? 0xFE : 0xFF;
                          handleStatChange('order', newOrder);
                        }}
                      />
                      <Label htmlFor="back-row" className="text-xs">Back Row</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>
      )}
    </div>
  );
} 