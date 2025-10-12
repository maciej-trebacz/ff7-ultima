import { SaveStates } from "@/components/SaveStates";
import { FF7 } from "@/useFF7";

export function SaveStatesModule(props: { ff7: FF7 }) {
  const ff7 = props.ff7;

  return (
    <div className="h-full">
      <SaveStates ff7={ff7} />
    </div>
  );
}
