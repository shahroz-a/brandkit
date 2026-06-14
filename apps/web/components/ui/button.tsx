import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "secondary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-[#1D4ED8] bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
        variant === "secondary" && "border-line bg-white text-ink hover:border-[#AAB5C5] hover:bg-[#F9FAFB]",
        variant === "ghost" && "border-transparent bg-transparent text-ink hover:bg-white",
        variant === "danger" && "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2]",
        className
      )}
      {...props}
    />
  );
}
