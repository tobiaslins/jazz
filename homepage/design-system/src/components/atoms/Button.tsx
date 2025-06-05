import { clsx } from "clsx";
import Link from "next/link";
import { forwardRef } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { Spinner } from "./Spinner";

export interface VariantClasses {
  primary: string;
  secondary: string;
  info: string;
  success: string;
  warning: string;
  danger: string;
  alert: string;
  tip: string;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "danger"
    | "alert"
    | "tip";
  color?: "light" | "dark" | "white" | "black" | "default";
  styleVariant?: "outline" | "inverted" | "ghost" | "text" | "default";
  state?: "hover" | "active" | "focus" | "disabled";
  size?: "sm" | "md" | "lg";
  href?: string;
  newTab?: boolean;
  icon?: IconName;
  loading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

function ButtonIcon({ icon, loading }: ButtonProps) {
  if (!Icon) return null;

  const className = "size-5";

  if (loading) return <Spinner className={className} />;

  if (icon) {
    return <Icon name={icon} className={className} />;
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      size = "md",
      variant = "primary",
      color,
      styleVariant,
      href,
      disabled,
      newTab,
      loading,
      loadingText,
      icon,
      type = "button",
      ...buttonProps
    },
    ref,
  ) => {
    const styleClass =
      styleClasses(variant)[styleVariant as keyof typeof styleClasses] || "";

    const getClasses = ({
      styleVariant,
    }: { styleVariant: string | undefined }) => {
      return {
        [sizeClasses[size as keyof typeof sizeClasses]]: size,
        [variantClass(variant)]: !styleVariant && !color,
        [colorClasses[color as keyof typeof colorClasses]]:
          color && !styleVariant,
        [styleClass]: styleVariant,
      };
    };

    const classNames = clsx(
      className,
      "inline-flex items-center justify-center gap-2 rounded-full text-center transition-colors",
      getClasses({ styleVariant }),
      "disabled:pointer-events-none disabled:opacity-70",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
    );

    if (href) {
      return (
        <Link
          href={href}
          target={newTab ? "_blank" : undefined}
          className={classNames}
        >
          <ButtonIcon icon={icon} loading={loading} />
          {children}
          {newTab ? (
            <span className="inline-block text-muted relative -top-0.5 -left-2 -mr-2">
              ⌝
            </span>
          ) : (
            ""
          )}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        {...buttonProps}
        disabled={disabled || loading}
        className={classNames}
        type={type}
      >
        <ButtonIcon icon={icon} loading={loading} />

        {loading && loadingText ? loadingText : children}
      </button>
    );
  },
);

// NB: Do not touch the below code, this is to patch over the tailwind qualms, it can not even be moved. (Trust me I tried.)
export const sizeClasses = {
  sm: "text-sm py-1 px-2",
  md: "py-1.5 px-3",
  lg: "md:text-lg  py-2 px-3 md:px-8 md:py-3",
};

export const colorClasses = {
  light:
    "bg-stone-200 text-stone-700 dark:text-stone-900 hover:bg-stone-200/80",
  dark: "bg-stone-900 text-stone-200 hover:bg-stone-900/80",
  white: "bg-white text-black dark:text-black hover:bg-white/80",
  black: "bg-black text-white dark:bg-black hover:bg-black/80",
};

const variantToBorderMap = {
  primary: "border-primary",
  secondary: "border-secondary",
  info: "border-info",
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
  alert: "border-alert",
  tip: "border-tip",
};

const variantToBgMap = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  alert: "bg-alert",
  tip: "bg-tip",
};

const variantToTextHoverMap = {
  primary: "hover:text-primary-transparent",
  secondary: "hover:text-secondary-transparent",
  info: "hover:text-info-transparent",
  success: "hover:text-success-transparent",
  warning: "hover:text-warning-transparent",
  danger: "hover:text-danger-transparent",
  alert: "hover:text-alert-transparent",
  tip: "hover:text-tip-transparent",
};

const variantToBgTransparentHoverMap = {
  primary: "hover:bg-primary-transparent",
  secondary: "hover:bg-secondary-transparent",
  info: "hover:bg-info-transparent",
  success: "hover:bg-success-transparent",
  warning: "hover:bg-warning-transparent",
  danger: "hover:bg-danger-transparent",
  alert: "hover:bg-alert-transparent",
  tip: "hover:bg-tip-transparent",
};

const variantToTextMap = {
  primary: "text-primary",
  secondary: "text-secondary",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  alert: "text-alert",
  tip: "text-tip",
};

const variantToColorMap = {
  primary: "blue",
  secondary: "aqua",
  info: "purple",
  success: "green",
  warning: "orange",
  danger: "red",
  alert: "yellow",
  tip: "cyan",
};

const colorToBgMap = {
  blue: "bg-blue/20",
  aqua: "bg-aqua/20",
  purple: "bg-purple/20",
  green: "bg-green/20",
  orange: "bg-orange/20",
  red: "bg-red/20",
  yellow: "bg-yellow/20",
  cyan: "bg-cyan/20",
};

const colorToBgHoverMap30 = {
  blue: "hover:bg-blue/30",
  aqua: "hover:bg-aqua/30",
  purple: "hover:bg-purple/30",
  green: "hover:bg-green/30",
  orange: "hover:bg-orange/30",
  red: "hover:bg-red/30",
  yellow: "hover:bg-yellow/30",
  cyan: "hover:bg-cyan/30",
};

const colorToBgHoverMap10 = {
  blue: "hover:bg-blue/10",
  aqua: "hover:bg-aqua/10",
  purple: "hover:bg-purple/10",
  green: "hover:bg-green/10",
  orange: "hover:bg-orange/10",
  red: "hover:bg-red/10",
  yellow: "hover:bg-yellow/10",
  cyan: "hover:bg-cyan/10",
};

const variantClass = (variant: keyof typeof variantToBgMap) =>
  `${variantToBgMap[variant]} ${variantToBgTransparentHoverMap[variant]} text-white`;

const styleClasses = (variant: keyof typeof variantToBgMap) => {
  return {
    outline: `border ${variantToBorderMap[variant]} bg-transparent hover:bg-transparent m-[0.07rem] hover:m-0 ${variantToTextMap[variant]} hover:border-2 dark:border-${variant}`,
    inverted: `${variantToTextMap[variant]} ${colorToBgHoverMap30[variantToColorMap[variant] as keyof typeof colorToBgHoverMap30]} ${colorToBgMap[variantToColorMap[variant] as keyof typeof colorToBgMap]}`,
    ghost: `bg-transparent ${variantToTextMap[variant]} ${colorToBgHoverMap10[variantToColorMap[variant] as keyof typeof colorToBgHoverMap10]}`,
    text: `bg-transparent ${variantToTextMap[variant]} underline underline-offset-2 hover:bg-transparent ${variantToTextHoverMap[variant]}`,
  };
};
