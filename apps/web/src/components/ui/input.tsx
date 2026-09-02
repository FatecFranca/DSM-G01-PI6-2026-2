import { cn } from "@/lib/utils";

export function Input({
  label,
  className,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full h-11 px-4 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          className
        )}
        {...props}
      />
    </div>
  );
}
