export const sizeClasses = {
  sm: "text-sm py-1 px-2",
  md: "py-1.5 px-3",
  lg: "md:text-lg  py-2 px-3 md:px-8 md:py-3",
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
  muted: "border-stone-200 dark:border-stone-700",
  highlight: "border-stone-900 dark:border-stone-100",
  default: "border-stone-600 dark:border-stone-200",
};

export const variantToActiveBorderMap = {
  primary: "active:border-primary-transparent focus:border-primary-transparent",
  secondary:
    "active:border-secondary-transparent focus:border-secondary-transparent",
  info: "active:border-info-transparent focus:border-info-transparent",
  success: "active:border-success-transparent focus:border-success-transparent",
  warning: "active:border-warning-transparent focus:border-warning-transparent",
  danger: "active:border-danger-transparent focus:border-danger-transparent",
  alert: "active:border-alert-transparent focus:border-alert-transparent",
  tip: "active:border-tip-transparent focus:border-tip-transparent",
  muted:
    "active:border-stone-200/30 focus:border-stone-200/30 dark:active:border-stone-900/30 dark:focus:border-stone-900/30",
  highlight:
    "active:border-stone-900/30 focus:border-stone-900/30 dark:active:border-stone-200/30 dark:focus:border-stone-200/30",
  default:
    "active:border-stone-600/30 dark:active:border-stone-100/30 focus:border-stone-600/30 dark:focus:border-stone-100/30",
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
  muted: "bg-stone-200 dark:bg-stone-900",
  highlight: "bg-stone-900 dark:bg-stone-200",
  default: "bg-stone-700 dark:bg-stone-100",
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
  muted: "hover:bg-stone-100/20 dark:hover:bg-stone-900/20",
  highlight: "hover:bg-stone-900/20 dark:hover:bg-stone-100/20",
  default: "hover:bg-stone-600/20 dark:hover:bg-stone-100/20",
};

export const variantToBgTransparentActiveMap = {
  primary: "active:bg-blue/20",
  secondary: "active:bg-indigo/20",
  info: "active:bg-purple/20",
  success: "active:bg-green/20",
  warning: "active:bg-orange/20",
  danger: "active:bg-red/20",
  alert: "active:bg-yellow/20",
  tip: "active:bg-cyan/20",
  muted: "active:bg-stone-400/20",
  highlight: "active:bg-stone-900/20",
  default: "active:bg-stone-600/20 dark:active:bg-stone-100/20",
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
  muted: "text-stone-500 dark:text-stone-400",
  highlight: "text-stone-900 dark:text-stone-100",
  default: "text-stone-700 dark:text-stone-100",
};

export const variantToTextHoverMap = {
  primary: "hover:text-primary-light",
  secondary: "hover:text-secondary-light",
  info: "hover:text-info-light",
  success: "hover:text-success-light",
  warning: "hover:text-warning-light",
  danger: "hover:text-danger-light",
  alert: "hover:text-alert-light",
  tip: "hover:text-tip-light",
  muted: "hover:text-stone-400 dark:hover:text-stone-500",
  highlight: "hover:text-stone-700 dark:hover:text-stone-300",
  default: "hover:text-stone-600 dark:hover:text-stone-200",
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
  muted: "active:text-stone-400 dark:active:text-stone-500",
  highlight: "active:text-stone-700 dark:active:text-stone-300",
  default: "active:text-stone-800 dark:active:text-stone-400",
};

export type VariantColor =
  | "blue"
  | "indigo"
  | "purple"
  | "green"
  | "orange"
  | "red"
  | "yellow"
  | "cyan"
  | "muted"
  | "highlight"
  | "default";

export const variantToColorMap = {
  primary: "blue",
  secondary: "indigo",
  info: "purple",
  success: "green",
  warning: "orange",
  danger: "red",
  alert: "yellow",
  tip: "cyan",
  muted: "muted",
  highlight: "highlight",
  default: "default",
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
  muted: "bg-stone-200/20 dark:bg-stone-900/50",
  highlight: "bg-stone-900/20 dark:bg-stone-100/50",
  default: "bg-stone-600/20 dark:bg-white/20",
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
  muted: "hover:bg-stone-200/30 dark:hover:bg-stone-900/30",
  highlight: "hover:bg-stone-900/30 dark:hover:bg-stone-100/30",
  default: "hover:bg-stone-600/30 dark:hover:bg-white/30",
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
  muted: "hover:bg-stone-200/30 dark:hover:bg-stone-800/30",
  highlight: "hover:bg-stone-900/10 dark:hover:bg-stone-100/10",
  default: "hover:bg-stone-600/10 dark:hover:bg-white/10",
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
  muted: "active:bg-stone-100/50 dark:active:bg-stone-900/50",
  highlight: "active:bg-stone-800/40 dark:active:bg-stone-200/40",
  default: "active:bg-stone-900/40 dark:active:bg-white/50",
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
  muted: "active:bg-stone-100/25 dark:active:bg-stone-900/25",
  highlight: "active:bg-stone-900/25 dark:active:bg-stone-100/25",
  default: "active:bg-black/25 dark:active:bg-white/25",
};

const gradiantClassesBase = "from-7% via-50% to-95%";

export const variantToBgGradientColorMap = {
  primary: `from-primary-dark via-primary to-primary-light ${gradiantClassesBase}`,
  secondary: `from-secondary-dark via-secondary to-secondary-light ${gradiantClassesBase}`,
  info: `from-info-dark via-info to-info-light ${gradiantClassesBase}`,
  success: `from-success-dark via-success to-success-light ${gradiantClassesBase}`,
  warning: `from-warning-dark via-warning to-warning-light ${gradiantClassesBase}`,
  danger: `from-danger-dark via-danger to-danger-light ${gradiantClassesBase}`,
  alert: `from-alert-dark via-alert to-alert-light ${gradiantClassesBase}`,
  tip: `from-tip-dark via-tip to-tip-light ${gradiantClassesBase}`,
  muted: `from-stone-200 via-stone-300 to-stone-400 ${gradiantClassesBase} dark:from-stone-900 dark:via-stone-900 dark:to-stone-800`,
  highlight: `from-stone-700 via-stone-800 to-stone-900 ${gradiantClassesBase} dark:from-stone-100 dark:via-stone-200 dark:to-stone-300`,
  default: `from-stone-200/40 via-white to-stone-100 ${gradiantClassesBase} dark:from-stone-900 dark:via-black dark:to-stone-950`,
};

export const variantToBgGradientHoverMap = {
  primary: `hover:from-primary-brightLight hover:to-primary-light ${gradiantClassesBase}`,
  secondary: `hover:from-secondary-brightLight hover:to-secondary-light ${gradiantClassesBase}`,
  info: `hover:from-info-brightLight hover:to-info-light ${gradiantClassesBase}`,
  success: `hover:from-success-brightLight hover:to-success-light ${gradiantClassesBase}`,
  warning: `hover:from-warning-brightLight hover:to-warning-light ${gradiantClassesBase}`,
  danger: `hover:from-danger-brightLight hover:to-danger-light ${gradiantClassesBase}`,
  alert: `hover:from-alert-brightLight hover:to-alert-light ${gradiantClassesBase}`,
  tip: `hover:from-tip-brightLight hover:to-tip-light ${gradiantClassesBase}`,
  muted: `hover:from-stone-200 hover:to-stone-300 ${gradiantClassesBase} dark:hover:from-stone-900 dark:hover:to-stone-700/70`,
  highlight: `hover:from-stone-700 hover:to-stone-800 ${gradiantClassesBase} dark:hover:from-stone-100 dark:hover:to-stone-200`,
  default: `hover:from-stone-100/50 hover:to-stone-100/50 dark:hover:from-stone-950 dark:hover:to-stone-900 ${gradiantClassesBase} border border-stone-100 dark:border-stone-900`,
};

export const variantToBgGradientActiveMap = {
  primary: `active:from-primary-brightDark active:to-primary-light ${gradiantClassesBase}`,
  secondary: `active:from-secondary-brightDark active:to-secondary-light ${gradiantClassesBase}`,
  info: `active:from-info-brightDark active:to-info-light ${gradiantClassesBase}`,
  success: `active:from-success-brightDark active:to-success-light ${gradiantClassesBase}`,
  warning: `active:from-warning-brightDark active:to-warning-light ${gradiantClassesBase}`,
  danger: `active:from-danger-brightDark active:to-danger-light ${gradiantClassesBase}`,
  alert: `active:from-alert-brightDark active:to-alert-light ${gradiantClassesBase}`,
  tip: `active:from-tip-brightDark active:to-tip-light ${gradiantClassesBase}`,
  muted: `active:from-stone-100 active:to-stone-300 ${gradiantClassesBase} dark:active:from-stone-900 dark:active:to-stone-800`,
  highlight: `active:from-stone-950 active:to-stone-900 ${gradiantClassesBase} dark:active:from-stone-100 dark:active:to-stone-200`,
  default: `active:from-white active:to-stone-100/60 dark:active:from-stone-950 dark:active:to-black ${gradiantClassesBase}`,
};

export const shadowClassesBase = "shadow-md";

export const variantToHoverShadowMap = {
  primary: `${shadowClassesBase} shadow-blue/20 hover:shadow-blue/40`,
  secondary: `${shadowClassesBase} shadow-indigo/20 hover:shadow-indigo/30`,
  info: `${shadowClassesBase} shadow-purple/20 hover:shadow-purple/30`,
  success: `${shadowClassesBase} shadow-green/20 hover:shadow-green/30`,
  warning: `${shadowClassesBase} shadow-orange/20 hover:shadow-orange/30`,
  danger: `${shadowClassesBase} shadow-red/20 hover:shadow-red/30`,
  alert: `${shadowClassesBase} shadow-yellow/20 hover:shadow-yellow/30`,
  tip: `${shadowClassesBase} shadow-cyan/20 hover:shadow-cyan/30`,
  muted: `${shadowClassesBase} shadow-stone-200/20 hover:shadow-stone-200/30 dark:shadow-stone-600/20 dark:hover:shadow-stone-600/30`,
  highlight: `${shadowClassesBase} shadow-stone-900/20 hover:shadow-stone-900/30 dark:shadow-white/20 dark:hover:shadow-white/30`,
  default: `${shadowClassesBase} shadow-stone-600/20 hover:shadow-stone-600/30 dark:shadow-stone-200/20 dark:hover:shadow-stone-200/30`,
};

const focusRingClassesBase =
  "focus:outline-none focus-visible:ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-opacity-10";

export const variantToButtonStateMap = {
  primary: `${variantToBgGradientActiveMap.primary} ${focusRingClassesBase} focus:ring-primary`,
  secondary: `${variantToBgGradientActiveMap.secondary} ${focusRingClassesBase} focus:ring-secondary`,
  info: `${variantToBgGradientActiveMap.info} ${focusRingClassesBase} focus:ring-info`,
  success: `${variantToBgGradientActiveMap.success} ${focusRingClassesBase} focus:ring-success`,
  warning: `${variantToBgGradientActiveMap.warning} ${focusRingClassesBase} focus:ring-warning`,
  danger: `${variantToBgGradientActiveMap.danger} ${focusRingClassesBase} focus:ring-danger`,
  alert: `${variantToBgGradientActiveMap.alert} ${focusRingClassesBase} focus:ring-alert`,
  tip: `${variantToBgGradientActiveMap.tip} ${focusRingClassesBase} focus:ring-tip`,
  muted: `${variantToBgGradientActiveMap.muted} ${focusRingClassesBase} focus:ring-stone-200 dark:focus:ring-stone-900`,
  highlight: `${variantToBgGradientActiveMap.highlight} ${focusRingClassesBase} focus:ring-stone-800 dark:focus:ring-stone-200`,
  default: `${variantToBgGradientActiveMap.default} ${focusRingClassesBase} focus:ring-black dark:focus:ring-white`,
};

export const variantStyleToButtonStateMap = {
  outline: `${focusRingClassesBase}`,
  inverted: `${focusRingClassesBase}`,
  ghost: `${focusRingClassesBase}`,
  text: `${focusRingClassesBase}`,
};
