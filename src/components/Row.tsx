"use strict";

function Row(props: {
  label: string;
  children: React.ReactNode;
  onLabelClick?: () => void;
}) {
  return (
    <div className="flex w-full p-1 bg-zinc-800 my-1">
      <div className={"flex-1 flex items-center font-semibold " + (props.onLabelClick ? "hover:text-white cursor-pointer" : "")} onClick={props.onLabelClick}>
        {props.label}
      </div>
      <div className="flex-shrink text-right">{props.children}</div>
    </div>
  );
}

export default Row;
