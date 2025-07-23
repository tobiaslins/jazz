import { mergeProps } from "@base-ui-components/react/merge-props";
import { useRender } from "@base-ui-components/react/use-render";
import { type VariantProps, tv } from "tailwind-variants";

const button = tv({
  base: "inline-flex items-center justify-center gap-2 rounded-lg text-center transition-colors w-fit text-nowrap disabled:pointer-events-none disabled:opacity-70 cursor-pointer font-medium",
  variants: {
    variant: {
      default:
        "shadow-sm shadow-stone-400/20 focus:outline-none focus-visible:ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-opacity-10 bg-gradient-to-t from-7% via-50% to-95%",
      secondary:
        "shadow-sm shadow-stone-400/20 focus:outline-none focus-visible:ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-opacity-10 bg-gradient-to-t from-7% via-50% to-95%",
      destructive:
        "shadow-sm shadow-stone-400/20 focus:outline-none focus-visible:ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-opacity-10 bg-gradient-to-t from-7% via-50% to-95%",
      ghost: "bg-transparent",
      outline: "border shadow-[5px_0px]",
      link: "bg-transparent underline underline-offset-2 p-0 hover:bg-transparent active:underline-stone-500",
      inverted: "shadow-sm",
    },
    intent: {
      default: "",
      primary: "",
      tip: "",
      info: "",
      success: "",
      warning: "",
      alert: "",
      danger: "",
      muted: "",
      strong: "",
    },
    size: {
      sm: "text-sm py-1 px-2",
      md: "py-1.5 px-3 h-[36px]",
      lg: "py-2 px-5 md:px-6 md:py-2.5",
    },
  },
  compoundVariants: [
    // Default Variant
    {
      variant: "default",
      intent: "default",
      className:
        "text-stone-700 dark:text-white hover:text-stone-800 active:text-stone-700 dark:hover:text-stone-100 dark:active:text-stone-200 from-stone-200/40 via-white to-stone-100 dark:from-stone-900 dark:via-black dark:to-stone-950 hover:from-stone-100/50 hover:to-stone-100/50 dark:hover:from-stone-950 dark:hover:to-stone-900 border border-stone-100 dark:border-stone-900 active:from-stone-200/50 active:to-stone-100/50 dark:active:from-stone-950 dark:active:to-black focus:ring-black dark:focus:ring-white",
    },
    {
      variant: "default",
      intent: "primary",
      className:
        "text-white from-primary-dark via-primary to-primary-light hover:from-primary-brightLight hover:to-primary-light active:from-primary-brightDark active:to-primary-light focus:ring-primary",
    },
    {
      variant: "default",
      intent: "tip",
      className:
        "text-white from-tip-dark via-tip to-tip-light hover:from-tip-brightLight hover:to-tip-light active:from-tip-brightDark active:to-tip-light focus:ring-tip",
    },
    {
      variant: "default",
      intent: "info",
      className:
        "text-white from-info-dark via-info to-info-light hover:from-info-brightLight hover:to-info-light active:from-info-brightDark active:to-info-light focus:ring-info",
    },
    {
      variant: "default",
      intent: "success",
      className:
        "text-white from-success-dark via-success to-success-light hover:from-success-brightLight hover:to-success-light active:from-success-brightDark active:to-success-light focus:ring-success",
    },
    {
      variant: "default",
      intent: "warning",
      className:
        "text-white from-warning-dark via-warning to-warning-light hover:from-warning-brightLight hover:to-warning-light active:from-warning-brightDark active:to-warning-light focus:ring-warning",
    },
    {
      variant: "default",
      intent: "alert",
      className:
        "text-white from-alert-dark via-alert to-alert-light hover:from-alert-brightLight hover:to-alert-light active:from-alert-brightDark active:to-alert-light focus:ring-alert",
    },
    {
      variant: "default",
      intent: "danger",
      className:
        "text-white from-danger-dark via-danger to-danger-light hover:from-danger-brightLight hover:to-danger-light active:from-danger-brightDark active:to-danger-light focus:ring-danger",
    },
    {
      variant: "default",
      intent: "muted",
      className:
        "text-stone-100 dark:text-stone-900 from-stone-200 via-stone-300 to-stone-400 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 hover:from-stone-200 hover:to-stone-300 dark:hover:from-stone-900 dark:hover:to-stone-700/70 active:from-stone-300 active:to-stone-300 dark:active:from-stone-900 dark:active:to-stone-800 focus:ring-stone-200 dark:focus:ring-stone-900",
    },
    {
      variant: "default",
      intent: "strong",
      className:
        "text-stone-100 dark:text-stone-900 from-stone-700 via-stone-800 to-stone-900 dark:from-stone-100 dark:via-stone-200 dark:to-stone-300 hover:from-stone-700 hover:to-stone-800 dark:hover:from-stone-100 dark:hover:to-stone-200 active:from-stone-950 active:to-stone-900 dark:active:from-stone-100 dark:active:to-stone-200 focus:ring-stone-800 dark:focus:ring-stone-200",
    },
    // Secondary Variant (alias for default-muted)
    {
      variant: "secondary",
      className:
        "text-stone-100 dark:text-stone-900 from-stone-200 via-stone-300 to-stone-400 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 hover:from-stone-200 hover:to-stone-300 dark:hover:from-stone-900 dark:hover:to-stone-700/70 active:from-stone-300 active:to-stone-300 dark:active:from-stone-900 dark:active:to-stone-800 focus:ring-stone-200 dark:focus:ring-stone-900",
    },
    // Destructive Variant (alias for default-danger)
    {
      variant: "destructive",
      className:
        "text-white from-danger-dark via-danger to-danger-light hover:from-danger-brightLight hover:to-danger-light active:from-danger-brightDark active:to-danger-light focus:ring-danger",
    },
    // Outline Variant
    {
      variant: "outline",
      intent: "default",
      className:
        "border-stone-600 dark:border-stone-200 text-stone-700 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-200 shadow-sm shadow-stone-600/20 hover:shadow-stone-600/30 dark:shadow-stone-200/20 dark:hover:shadow-stone-200/30 active:bg-stone-600/20 dark:active:bg-stone-100/20",
    },
    {
      variant: "outline",
      intent: "primary",
      className:
        "border-primary text-primary hover:text-primary-light shadow-sm shadow-blue/20 hover:shadow-blue/40 active:bg-blue/20",
    },
    {
      variant: "outline",
      intent: "tip",
      className:
        "border-tip text-tip hover:text-tip-light shadow-sm shadow-cyan/20 hover:shadow-cyan/30 active:bg-cyan/20",
    },
    {
      variant: "outline",
      intent: "info",
      className:
        "border-info text-info hover:text-info-light shadow-sm shadow-purple/20 hover:shadow-purple/30 active:bg-purple/20",
    },
    {
      variant: "outline",
      intent: "success",
      className:
        "border-success text-success hover:text-success-light shadow-sm shadow-green/20 hover:shadow-green/30 active:bg-green/20",
    },
    {
      variant: "outline",
      intent: "warning",
      className:
        "border-warning text-warning hover:text-warning-light shadow-sm shadow-orange/20 hover:shadow-orange/30 active:bg-orange/20",
    },
    {
      variant: "outline",
      intent: "alert",
      className:
        "border-alert text-alert hover:text-alert-light shadow-sm shadow-yellow/20 hover:shadow-yellow/30 active:bg-yellow/20",
    },
    {
      variant: "outline",
      intent: "danger",
      className:
        "border-danger text-danger hover:text-danger-light shadow-sm shadow-red/20 hover:shadow-red/30 active:bg-red/20",
    },
    {
      variant: "outline",
      intent: "muted",
      className:
        "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-400 dark:hover:text-stone-500 shadow-sm shadow-stone-200/20 hover:shadow-stone-200/30 dark:shadow-stone-600/20 dark:hover:shadow-stone-600/30 active:bg-stone-400/20",
    },
    {
      variant: "outline",
      intent: "strong",
      className:
        "border-stone-900 dark:border-stone-100 text-stone-900 dark:text-white hover:text-stone-700 dark:hover:text-stone-300 shadow-sm shadow-stone-900/20 hover:shadow-stone-900/30 dark:shadow-white/20 dark:hover:shadow-white/30 active:bg-stone-900/20",
    },
    // Inverted Variant
    {
      variant: "inverted",
      intent: "default",
      className:
        "text-stone-700 dark:text-stone-100 hover:bg-stone-600/30 dark:hover:bg-white/30 bg-stone-600/20 dark:bg-white/20 active:bg-stone-900/40 dark:active:bg-white/50",
    },
    {
      variant: "inverted",
      intent: "primary",
      className: "text-primary hover:bg-blue/30 bg-blue/20 active:bg-blue/50",
    },
    {
      variant: "inverted",
      intent: "tip",
      className: "text-tip hover:bg-cyan/30 bg-cyan/20 active:bg-cyan/50",
    },
    {
      variant: "inverted",
      intent: "info",
      className:
        "text-info hover:bg-purple/30 bg-purple/20 active:bg-purple/50",
    },
    {
      variant: "inverted",
      intent: "success",
      className:
        "text-success hover:bg-green/30 bg-green/20 active:bg-green/50",
    },
    {
      variant: "inverted",
      intent: "warning",
      className:
        "text-warning hover:bg-orange/30 bg-orange/20 active:bg-orange/50",
    },
    {
      variant: "inverted",
      intent: "alert",
      className:
        "text-alert hover:bg-yellow/30 bg-yellow/20 active:bg-yellow/50",
    },
    {
      variant: "inverted",
      intent: "danger",
      className: "text-danger hover:bg-red/30 bg-red/20 active:bg-red/50",
    },
    {
      variant: "inverted",
      intent: "muted",
      className:
        "text-stone-500 dark:text-stone-400 hover:bg-stone-200/30 dark:hover:bg-stone-900/30 bg-stone-200/20 dark:bg-stone-900/50 active:bg-stone-100/50 dark:active:bg-stone-900/50",
    },
    {
      variant: "inverted",
      intent: "strong",
      className:
        "text-stone-900 dark:text-white hover:bg-stone-900/30 dark:hover:bg-stone-100/30 bg-stone-900/20 dark:bg-stone-100/50 active:bg-stone-800/40 dark:active:bg-stone-200/40",
    },
    // Ghost Variant
    {
      variant: "ghost",
      intent: "default",
      className:
        "text-stone-700 dark:text-stone-100 hover:bg-stone-600/10 dark:hover:bg-white/10 active:bg-black/25 dark:active:bg-white/25",
    },
    {
      variant: "ghost",
      intent: "primary",
      className: "text-primary hover:bg-blue/10 active:bg-blue/25",
    },
    {
      variant: "ghost",
      intent: "tip",
      className: "text-tip hover:bg-cyan/10 active:bg-cyan/25",
    },
    {
      variant: "ghost",
      intent: "info",
      className: "text-info hover:bg-purple/10 active:bg-purple/25",
    },
    {
      variant: "ghost",
      intent: "success",
      className: "text-success hover:bg-green/10 active:bg-green/25",
    },
    {
      variant: "ghost",
      intent: "warning",
      className: "text-warning hover:bg-orange/10 active:bg-orange/25",
    },
    {
      variant: "ghost",
      intent: "alert",
      className: "text-alert hover:bg-yellow/10 active:bg-yellow/25",
    },
    {
      variant: "ghost",
      intent: "danger",
      className: "text-danger hover:bg-red/10 active:bg-red/25",
    },
    {
      variant: "ghost",
      intent: "muted",
      className:
        "text-stone-500 dark:text-stone-400 hover:bg-stone-200/30 dark:hover:bg-stone-800/30 active:bg-stone-100/25 dark:active:bg-stone-900/25",
    },
    {
      variant: "ghost",
      intent: "strong",
      className:
        "text-stone-900 dark:text-white hover:bg-stone-900/10 dark:hover:bg-stone-100/10 active:bg-stone-900/25 dark:active:bg-stone-100/25",
    },
    // Link Variant
    {
      variant: "link",
      intent: "default",
      className:
        "text-stone-700 dark:text-stone-100 hover:text-stone-600 dark:hover:text-stone-200 active:text-stone-800 dark:active:text-stone-400",
    },
    {
      variant: "link",
      intent: "primary",
      className:
        "text-primary hover:text-primary-light active:text-primary-dark",
    },
    {
      variant: "link",
      intent: "tip",
      className: "text-tip hover:text-tip-light active:text-tip-dark",
    },
    {
      variant: "link",
      intent: "info",
      className: "text-info hover:text-info-light active:text-info-dark",
    },
    {
      variant: "link",
      intent: "success",
      className:
        "text-success hover:text-success-light active:text-success-dark",
    },
    {
      variant: "link",
      intent: "warning",
      className:
        "text-warning hover:text-warning-light active:text-warning-dark",
    },
    {
      variant: "link",
      intent: "alert",
      className: "text-alert hover:text-alert-light active:text-alert-dark",
    },
    {
      variant: "link",
      intent: "danger",
      className: "text-danger hover:text-danger-light active:text-danger-dark",
    },
    {
      variant: "link",
      intent: "muted",
      className:
        "text-stone-500 dark:text-stone-400 hover:text-stone-400 dark:hover:text-stone-500 active:text-stone-400 dark:active:text-stone-500",
    },
    {
      variant: "link",
      intent: "strong",
      className:
        "text-stone-900 dark:text-white hover:text-stone-700 dark:hover:text-stone-300 active:text-stone-700 dark:active:text-stone-300",
    },
  ],
  defaultVariants: {
    size: "md",
    variant: "default",
    intent: "default",
  },
});

type ButtonVariants = VariantProps<typeof button>;

interface ButtonProps
  extends Omit<useRender.ComponentProps<"button">, keyof ButtonVariants>,
    ButtonVariants {}

export function Button({ render = <button />, ...props }: ButtonProps) {
  const element = useRender({
    render,
    props: mergeProps<"button">(
      {
        className: button({
          size: props.size,
          variant: props.variant,
          intent: props.intent,
        }),
      },
      props,
    ),
  });

  return element;
}
