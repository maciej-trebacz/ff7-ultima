"use strict";

function Row(props: {
  label: string;
  children: React.ReactNode;
  onLabelClick?: () => void;
  onRowClick?: () => void;
}) {
  return (
    <div className={"flex w-full tooltip-up my-1 " + (props.onRowClick ? "tooltip" : "")} data-tip="Click to edit">
      <div className={"flex w-full p-1 bg-zinc-800 " + (props.onRowClick ? "hover:text-white cursor-pointer" : "")} onClick={props.onRowClick}>
        <div className={"flex-1 flex text-left items-center font-semibold " + (props.onLabelClick ? "hover:text-white cursor-pointer" : "")} onClick={props.onLabelClick}>
          {props.label}
        </div>
        <div className="flex-shrink text-right">{props.children}</div>
      </div>
    </div>
  );
}

export default Row;
