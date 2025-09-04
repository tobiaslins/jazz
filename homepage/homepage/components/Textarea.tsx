import { ComponentProps } from "react";
import { VariantProps, tv } from "tailwind-variants";

type TextareaVariants = VariantProps<typeof textarea>;

interface TextareaProps extends ComponentProps<"textarea">, TextareaVariants {}

export function Textarea({ sizeStyle, intent, ...props }: TextareaProps) {
  return <textarea className={textarea({ sizeStyle, intent })} {...props} />;
}

const textarea = tv({
  base: "w-full rounded-md border px-3 py-2 text-base font-medium text-stone-900 dark:text-white dark:bg-stone-925 resize-none focus:outline-none focus:ring-2",
  variants: {
    intent: {
      default: "border-stone-500/50 focus:ring-stone-800/50",
      primary: "border-primary focus:ring-blue/50",
      success: "border-success focus:ring-green/50",
      warning: "border-warning focus:ring-yellow/50",
      danger: "border-danger focus:ring-red/50",
      info: "border-info focus:ring-blue/50",
      tip: "border-tip focus:ring-cyan/50",
      muted: "border-muted focus:ring-gray/50",
      strong: "border-strong focus:ring-stone-900/50",
    },
    sizeStyle: {
      sm: "text-sm py-1 px-2 h-20",
      md: "py-1.5 px-3 h-24",
      lg: "py-2 px-5 md:px-6 md:py-2.5 h-32",
    },
  },
  defaultVariants: {
    sizeStyle: "md",
    intent: "default",
  },
});
