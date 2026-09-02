import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all rounded-xl disabled:opacity-50",
        {
          "bg-brand-600 text-white hover:bg-brand-700": variant === "primary",
          "bg-white text-slate-700 border border-border hover:bg-slate-50":
            variant === "secondary",
          "text-slate-600 hover:bg-slate-100": variant === "ghost",
          "bg-red-500 text-white hover:bg-red-600": variant === "danger",
          "h-9 px-3 text-sm": size === "sm",
          "h-11 px-5 text-sm": size === "md",
          "h-12 px-6 text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
