import { Input as BaseUiInput } from "@base-ui-components/react/input";
import { mergeProps } from "@base-ui-components/react/merge-props";
import { useRender } from "@base-ui-components/react/use-render";
import * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";

type InputVariants = VariantProps<typeof input>;

interface InputProps
  extends Omit<useRender.ComponentProps<"input">, keyof InputVariants>,
    InputVariants {}

export default function Input({
  render = <BaseUiInput />,
  ...props
}: InputProps) {
  const element = useRender({
    render,
    props: mergeProps<"input">(
      {
        className: input({
          sizeStyle: props.sizeStyle || "md",
          intent: props.intent || "default",
        }),
      },
      props,
    ),
  });
  return element;
}

const input = tv({
  base: "w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline",
  variants: {
    base: "w-full rounded-md border px-2.5 py-1 shadow-sm h-[36px] font-medium text-stone-900 dark:text-white dark:bg-stone-925",
    intent: {
      default: "focus:outline-blue-800",
      primary: "focus:outline-blue-800",
      secondary: "focus:outline-blue-800",
      success: "focus:outline-blue-800",
      warning: "focus:outline-blue-800",
      danger: "focus:outline-blue-800",
      muted: "focus:outline-blue-800",
      strong: "focus:outline-blue-800",
    },
    sizeStyle: {
      sm: "text-sm py-1 px-2 [&>svg]:size-4 h-7",
      md: "py-1.5 px-3 h-[36px] [&>svg]:size-5 h-9",
      lg: "py-2 px-5 md:px-6 md:py-2.5 [&>svg]:size-6 h-10",
    },
  },
});
