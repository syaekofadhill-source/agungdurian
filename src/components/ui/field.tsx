import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-orchard/15 bg-white/70 px-3.5 text-sm text-bark placeholder:text-moss/60 " +
  "transition-[border-color,box-shadow] duration-200 outline-none " +
  "focus:border-gold focus:ring-4 focus:ring-gold/20 aria-[invalid=true]:border-crimson aria-[invalid=true]:ring-crimson/15 " +
  "disabled:opacity-60";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-11 appearance-none bg-no-repeat pr-9", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-[13px] font-semibold text-bark", className)} {...props} />;
}

export function FieldError({ messages }: { messages?: string[] | undefined }) {
  if (!messages?.length) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-crimson">
      {messages[0]}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string[] | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error?.length ? <p className="mt-1.5 text-xs text-moss">{hint}</p> : null}
      <FieldError messages={error} />
    </div>
  );
}
