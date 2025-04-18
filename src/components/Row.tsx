"use strict";

import { ReactNode } from "react";

function Row(props: {
  label: string | ReactNode;
  children: ReactNode;
  onLabelClick?: () => void;
  onRowClick?: () => void;
  className?: string;
}) {
  return (
    <div className={"flex w-full tooltip-up my-1 first:mt-0 " + (props.onRowClick ? "tooltip" : "")} data-tip="Click to edit">
      <label className={"flex items-center w-full px-2 py-1.5 rounded-md text-xs bg-zinc-800 " + (props.onRowClick ? "hover:text-white hover:bg-zinc-700 cursor-pointer" : "") + " " + (props.className || "")} onClick={props.onRowClick}>
        <div className={"flex-1 flex text-left items-center font-semibold " + (props.onLabelClick ? "hover:text-white cursor-pointer" : "")} onClick={props.onLabelClick}>
          {props.label}
        </div>
        <div className="flex-shrink text-right flex items-center">{props.children}</div>
      </label>
    </div>
  );
}

export default Row;
