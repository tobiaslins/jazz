import { clsx } from "clsx";
import Link from "next/link";
import { forwardRef } from "react";
import {
  Style,
  Variant,
  VariantColor,
  colorToBgActiveMap25,
  colorToBgActiveMap50,
  colorToBgHoverMap10,
  colorToBgHoverMap30,
  colorToBgMap,
  shadowClassesBase,
  sizeClasses,
  styleToBgGradientColorMap,
  styleToBgGradientHoverMap,
  styleToBgTransparentActiveMap,
  styleToBorderMap,
  styleToButtonStateMap,
  styleToColorMap,
  styleToHoverShadowMap,
  styleToTextActiveMap,
  styleToTextHoverMap,
  styleToTextMap,
} from "../../utils/tailwindClassesMap";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { Spinner } from "./Spinner";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  styleType?: Style;
  variant?: Variant;
  state?: "hover" | "active" | "focus" | "disabled";
  size?: "sm" | "md" | "lg";
  href?: string;
  newTab?: boolean;
  icon?: IconName;
  iconPosition?: "left" | "right" | "center";
  loading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      size = "md",
      styleType = "default",
      variant,
      href,
      disabled,
      newTab,
      loading,
      loadingText,
      icon,
      iconPosition = "left",
      type = "button",
      ...buttonProps
    },
    ref,
  ) => {
    const styleClass =
      styleClasses(styleType, variant)[variant as keyof typeof styleClasses] ||
      "";

    const getClasses = ({ variant }: { variant: string | undefined }) => {
      return {
        [sizeClasses[size as keyof typeof sizeClasses]]: size,
        [variantClass(styleType)]: !variant,
        [styleClass]: variant,
      };
    };

    const classNames = clsx(
      "inline-flex items-center justify-center gap-2 rounded-lg text-center transition-colors w-fit text-nowrap",
      getClasses({ variant }),
      "disabled:pointer-events-none disabled:opacity-70",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className,
    );

    if (href) {
      return (
        <Link
          href={href}
          target={newTab ? "_blank" : undefined}
          className={classNames}
        >
          {icon && (
            <Icon
              name={icon}
              className={`size-5 ${iconPosition === "left" ? "mr-2" : iconPosition === "right" ? "ml-2" : ""}, ${iconVariant(styleType, variant)}`}
            />
          )}
          {children}
          {newTab ? (
            <span
              className={`inline-block relative -top-0.5 -left-2 -mr-2 ${styleToTextMap[styleType as keyof typeof styleToTextMap]}`}
            >
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
        {loading ? (
          <Spinner className="size-5" />
        ) : (
          icon &&
          iconPosition === "left" && (
            <Icon name={icon} styleType={iconVariant(styleType, variant)} />
          )
        )}
        {loading && loadingText ? loadingText : children}
        {icon && iconPosition === "right" && (
          <Icon
            name={icon}
            styleType={iconVariant(styleType, variant)}
            hasHover={true}
          />
        )}
      </button>
    );
  },
);

const iconVariant = (styleType: Style, variant: Variant | undefined) => {
  return variant ? styleType : styleType === "default" ? "default" : "white";
};
const textColorVariant = (style: Style) => {
  return style === "default"
    ? "text-stone-700 dark:text-white hover:text-stone-800 active:text-stone-700 dark:hover:text-stone-100 dark:active:text-stone-200"
    : style === "strong"
      ? "text-stone-100 dark:text-stone-900"
      : "text-white";
};

const variantClass = (styleType: Style) =>
  `${styleToBgGradientColorMap[styleType]} ${styleToBgGradientHoverMap[styleType]} ${textColorVariant(styleType)} ${styleToButtonStateMap[styleType]} ${shadowClassesBase} shadow-stone-400/20`;

const styleClasses = (styleType: Style, variant: Variant | undefined) => {
  return {
    outline: `border ${styleToBorderMap[styleType]} ${styleToTextMap[styleType]} ${styleToTextHoverMap[styleType]} ${styleToHoverShadowMap[styleType]} ${styleToBgTransparentActiveMap[styleType]} shadow-[5px_0px]`,
    inverted: `${styleToTextMap[styleType]} ${colorToBgHoverMap30[styleToColorMap[styleType] as VariantColor]} ${colorToBgMap[styleToColorMap[styleType] as VariantColor]} ${colorToBgActiveMap50[styleToColorMap[styleType] as VariantColor]} ${shadowClassesBase}`,
    ghost: `bg-transparent ${styleToTextMap[styleType]} ${colorToBgHoverMap10[styleToColorMap[styleType] as VariantColor]} ${colorToBgActiveMap25[styleToColorMap[styleType] as VariantColor]}`,
    link: `bg-transparent ${styleToTextMap[styleType]} underline underline-offset-2 p-0 hover:bg-transparent ${styleToTextHoverMap[styleType]} ${styleToTextActiveMap[styleType]} active:underline-stone-500`,
    secondary: `bg-stone-300 ${styleToTextMap[styleType]} hover:bg-stone-400/80 active:bg-stone-500/80`,
    destructive: `bg-danger text-white hover:bg-red/80 active:bg-red/70`,
    default: `${styleToBgGradientColorMap["default"]} ${styleToBgGradientHoverMap["default"]} ${textColorVariant("default")} ${styleToButtonStateMap["default"]} ${shadowClassesBase} shadow-stone-400/20`,
  };
};
