type ActionButtonProps = {
  label: string;
  pending?: boolean;
  pendingLabel?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

export const ActionSpinner = () => {
  return <span className="action-spinner" aria-hidden="true" />;
};

export const ActionButton = (options: ActionButtonProps) => {
  const {
    label,
    pending = false,
    pendingLabel = label,
    disabled = false,
    className,
    onClick,
  } = options;
  const classNames =
    className === undefined || className.length === 0
      ? "action-control"
      : `action-control ${className}`;

  return (
    <button
      type="button"
      className={classNames}
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={onClick}
    >
      {pending ? <ActionSpinner /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
};
