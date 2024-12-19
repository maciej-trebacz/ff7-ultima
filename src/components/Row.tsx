"use strict";

function Row(props: {
  label: string;
  children: React.ReactNode;
  onLabelClick?: () => void;
  onRowClick?: () => void;
}) {
  return (
    <div className={"flex w-full tooltip-up my-1 first:mt-0 " + (props.onRowClick ? "tooltip" : "")} data-tip="Click to edit">
      <label className={"flex cursor-pointer items-center w-full px-2 py-1.5 rounded-md text-xs bg-zinc-800 " + (props.onRowClick ? "hover:text-white cursor-pointer" : "")} onClick={props.onRowClick}>
        <div className={"flex-1 flex text-left items-center font-semibold " + (props.onLabelClick ? "hover:text-white cursor-pointer" : "")} onClick={props.onLabelClick}>
          {props.label}
        </div>
        <div className="flex-shrink text-right flex items-center">{props.children}</div>
      </label>
    </div>
  );
}

export default Row;
