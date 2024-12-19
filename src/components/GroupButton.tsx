export default function GroupButton(props: {children: React.ReactNode, small?: boolean, disabled?: boolean, active?: boolean, onClick?: () => void}) {
  return (
    <button className={"btn btn-xs h-5 min-h-5 join-item " + (props.active ? "btn-primary font-bold" : "btn-ghost") + (props.small ? " w-8" : "w-14") + (props.disabled ? " opacity-50" : "")} onClick={!props.disabled ? props.onClick : undefined}>{props.children}</button>
  );
}