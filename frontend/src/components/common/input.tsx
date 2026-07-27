import { forwardRef, type InputHTMLAttributes, type ReactElement } from "react";

import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref,
): ReactElement {
  const inputId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-2 text-sm">
      {label ? <span className="font-medium text-ms-text">{label}</span> : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-12 w-full rounded-xl border border-ms-border bg-ms-elevated px-4 text-ms-text outline-none transition placeholder:text-ms-muted focus:border-ms-primary",
          error && "border-ms-danger",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-ms-danger">{error}</span> : null}
    </label>
  );
});
