import { cn } from "./cn";

export function Label({ htmlFor, children, hint, className }: { htmlFor?: string; children: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-2 flex items-baseline justify-between gap-3", className)}>
      <label htmlFor={htmlFor} className="text-[14px] font-medium text-text">
        {children}
      </label>
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] text-error" role="alert">
      {children}
    </p>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: React.ReactNode };

export function TextField({ label, error, hint, id, name, className, ...rest }: InputProps) {
  const fid = id ?? name;
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={fid} hint={hint}>
          {label}
        </Label>
      )}
      <input
        id={fid}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-err` : undefined}
        className="field h-11"
        {...rest}
      />
      <FieldError id={`${fid}-err`}>{error}</FieldError>
    </div>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string };

export function SelectField({ label, error, id, name, className, children, ...rest }: SelectProps) {
  const fid = id ?? name;
  return (
    <div className={className}>
      {label && <Label htmlFor={fid}>{label}</Label>}
      <div className="relative">
        <select id={fid} name={name} aria-invalid={error ? true : undefined} className="field h-11 appearance-none pr-10" {...rest}>
          {children}
        </select>
        <svg className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; hint?: React.ReactNode };

export function TextArea({ label, error, hint, id, name, className, ...rest }: AreaProps) {
  const fid = id ?? name;
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={fid} hint={hint}>
          {label}
        </Label>
      )}
      <textarea id={fid} name={name} aria-invalid={error ? true : undefined} className="field min-h-[112px] resize-y" {...rest} />
      <FieldError>{error}</FieldError>
    </div>
  );
}
