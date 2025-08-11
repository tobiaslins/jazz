import { tv } from "tailwind-variants";
import { cn } from "../lib/utils.js";

type LabelProps = React.HTMLAttributes<HTMLLabelElement> & {
  isHiddenVisually?: boolean;
  size?: "sm" | "md" | "lg";
  htmlFor?: HTMLLabelElement["htmlFor"];
};

export default function Label({ ...props }: LabelProps) {
  return (
    <label
      className={cn(
        label({
          isHiddenVisually: props.isHiddenVisually || false,
          size: props.size || "md",
        }),
        props.className,
      )}
      {...props}
    />
  );
}

const label = tv({
  base: "block text-sm font-medium text-stone-900 dark:text-white flex items-center",
  variants: {
    isHiddenVisually: {
      true: "sr-only",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
  },
});
