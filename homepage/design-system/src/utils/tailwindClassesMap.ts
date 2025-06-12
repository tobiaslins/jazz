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

export const variantToBorderMap = {
  primary: "border-primary",
  secondary: "border-secondary",
  info: "border-info",
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
  alert: "border-alert",
  tip: "border-tip",
};

export const variantToBgMap = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  alert: "bg-alert",
  tip: "bg-tip",
};

export const variantToTextHoverMap = {
  primary: "hover:text-primary-transparent",
  secondary: "hover:text-secondary-transparent",
  info: "hover:text-info-transparent",
  success: "hover:text-success-transparent",
  warning: "hover:text-warning-transparent",
  danger: "hover:text-danger-transparent",
  alert: "hover:text-alert-transparent",
  tip: "hover:text-tip-transparent",
};

export const variantToBgTransparentHoverMap = {
  primary: "hover:bg-primary-transparent",
  secondary: "hover:bg-secondary-transparent",
  info: "hover:bg-info-transparent",
  success: "hover:bg-success-transparent",
  warning: "hover:bg-warning-transparent",
  danger: "hover:bg-danger-transparent",
  alert: "hover:bg-alert-transparent",
  tip: "hover:bg-tip-transparent",
};

export const variantToTextMap = {
  primary: "text-primary",
  secondary: "text-secondary",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  alert: "text-alert",
  tip: "text-tip",
};

export const variantToTextActiveMap = {
  primary: "active:text-primary-dark",
  secondary: "active:text-secondary-dark",
  info: "active:text-info-dark",
  success: "active:text-success-dark",
  warning: "active:text-warning-dark",
  danger: "active:text-danger-dark",
  alert: "active:text-alert-dark",
  tip: "active:text-tip-dark",
};

export const variantToColorMap = {
  primary: "blue",
  secondary: "indigo",
  info: "purple",
  success: "green",
  warning: "orange",
  danger: "red",
  alert: "yellow",
  tip: "cyan",
};

export const colorToBgMap = {
  blue: "bg-blue/20",
  indigo: "bg-indigo-500/20",
  purple: "bg-purple/20",
  green: "bg-green/20",
  orange: "bg-orange/20",
  red: "bg-red/20",
  yellow: "bg-yellow/20",
  cyan: "bg-cyan/20",
};

export const colorToBgHoverMap30 = {
  blue: "hover:bg-blue/30",
  indigo: "hover:bg-indigo-500/30",
  purple: "hover:bg-purple/30",
  green: "hover:bg-green/30",
  orange: "hover:bg-orange/30",
  red: "hover:bg-red/30",
  yellow: "hover:bg-yellow/30",
  cyan: "hover:bg-cyan/30",
};

export const colorToBgHoverMap10 = {
  blue: "hover:bg-blue/10",
  indigo: "hover:bg-indigo-500/10",
  purple: "hover:bg-purple/10",
  green: "hover:bg-green/10",
  orange: "hover:bg-orange/10",
  red: "hover:bg-red/10",
  yellow: "hover:bg-yellow/10",
  cyan: "hover:bg-cyan/10",
};

export const colorToBgActiveMap50 = {
  blue: "active:bg-blue/50",
  indigo: "active:bg-indigo-500/50",
  purple: "active:bg-purple/50",
  green: "active:bg-green/50",
  orange: "active:bg-orange/50",
  red: "active:bg-red/50",
  yellow: "active:bg-yellow/50",
  cyan: "active:bg-cyan/50",
};

export const colorToBgActiveMap25 = {
  blue: "active:bg-blue/25",
  indigo: "active:bg-indigo-500/25",
  purple: "active:bg-purple/25",
  green: "active:bg-green/25",
  orange: "active:bg-orange/25",
  red: "active:bg-red/25",
  yellow: "active:bg-yellow/25",
  cyan: "active:bg-cyan/25",
};

const focusRingClassesBase =
  "focus:outline-none focus-visible:ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-opacity-10";

export const variantToButtonStateMap = {
  primary: `active:bg-primary-light ${focusRingClassesBase} focus:ring-primary`,
  secondary: `active:bg-secondary-dark ${focusRingClassesBase} focus:ring-secondary`,
  info: `active:bg-info-light ${focusRingClassesBase} focus:ring-info`,
  success: `active:bg-success-light ${focusRingClassesBase} focus:ring-success`,
  warning: `active:bg-warning-light ${focusRingClassesBase} focus:ring-warning`,
  danger: `active:bg-danger-light ${focusRingClassesBase} focus:ring-danger`,
  alert: `active:bg-alert-light ${focusRingClassesBase} focus:ring-alert`,
  tip: `active:bg-tip-light ${focusRingClassesBase} focus:ring-tip`,
};

export const variantStyleToButtonStateMap = {
  outline: `${focusRingClassesBase}`,
  inverted: `${focusRingClassesBase}`,
  ghost: `${focusRingClassesBase}`,
  text: `${focusRingClassesBase}`,
};

export const colourStyleToButtonStateMap = {
  light: `${focusRingClassesBase}`,
  dark: `${focusRingClassesBase}`,
  white: `${focusRingClassesBase}`,
  black: `${focusRingClassesBase}`,
};

const shadowClassesBase = "shadow-md shadow-opacity-10";

export const variantToHoverShadowMap = {
  primary: `${shadowClassesBase} hover:shadow-blue/25`,
  secondary: `${shadowClassesBase} hover:shadow-indigo/25`,
  info: `${shadowClassesBase} hover:shadow-purple/25`,
  success: `${shadowClassesBase} hover:shadow-green/25`,
  warning: `${shadowClassesBase} hover:shadow-orange/25`,
  danger: `${shadowClassesBase} hover:shadow-red/25`,
  alert: `${shadowClassesBase} hover:shadow-yellow/25`,
  tip: `${shadowClassesBase} hover:shadow-cyan/25`,
};
