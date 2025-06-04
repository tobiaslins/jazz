import { clsx } from "clsx";
import Link from "next/link";
import { forwardRef } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { Spinner } from "./Spinner";

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
      color = "default",
      styleVariant = "default",
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
    const sizeClasses = {
      sm: "text-sm py-1 px-2",
      md: "py-1.5 px-3",
      lg: "md:text-lg  py-2 px-3 md:px-8 md:py-3",
    };

    const variantClasses = {
      primary: "bg-primary hover:bg-primary-transparent",
      secondary: "bg-secondary hover:bg-secondary-transparent",
      info: "bg-info hover:bg-info-transparent",
      warning: "bg-warning hover:bg-warning-transparent",
      success: "bg-success hover:bg-success-transparent",
      danger: "bg-danger hover:bg-danger-transparent",
      alert: "bg-alert hover:bg-alert-transparent",
      tip: "bg-tip hover:bg-tip-transparent",
    };

    const colorClasses = {
      light:
        "bg-stone-200 text-stone-700 dark:text-stone-900 hover:bg-stone-200/80",
      dark: "bg-stone-900 text-stone-900 hover:bg-stone-900/80",
      white: "bg-white text-pink dark:text-black hover:bg-white/80",
      black: "bg-black text-white dark:bg-black hover:bg-black/50",
      default: "",
    };

    const styleClasses = {
      outline: `border border-${variant} bg-transparent hover:bg-transparent m-[0.07rem] hover:m-0 text-${variant} hover:border-2`,
      inverted:
        "bg-blue/20 dark:bg-blue/20 text-primary dark:text-primary hover:bg-blue/30 dark:hover:bg-blue/30",
      ghost:
        "bg-transparent text-primary dark:text-primary hover:bg-blue/10 dark:hover:bg-blue/20",
      text: "bg-transparent text-primary dark:text-primary underline underline-offset-2 hover:bg-transparent hover:text-primary-dark dark:hover:text-primary-dark",
      default: "",
    };

    const classNames = clsx(
      className,
      "inline-flex items-center justify-center gap-2 rounded-lg text-center transition-colors text-white font-medium box-content",
      "disabled:pointer-events-none disabled:opacity-70",
      sizeClasses[size as keyof typeof sizeClasses],
      variantClasses[variant as keyof typeof variantClasses],
      colorClasses[color as keyof typeof colorClasses],
      styleClasses[styleVariant as keyof typeof styleClasses],
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
