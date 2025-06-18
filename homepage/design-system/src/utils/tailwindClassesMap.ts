export const sizeClasses = {
  sm: "text-sm py-1 px-2",
  md: "py-1.5 px-3",
  lg: "md:text-lg  py-2 px-3 md:px-8 md:py-3",
};

export const colorClasses = {
  light:
    "bg-stone-200 text-stone-700 dark:text-stone-900 hover:bg-stone-200/60 active:bg-stone-200/70",
  dark: "bg-stone-900 text-stone-200 hover:bg-stone-900/60 active:bg-stone-900/70",
  white:
    "bg-white text-black dark:text-black hover:bg-white/60 active:bg-white/70",
  black:
    "bg-black text-white dark:bg-black hover:bg-black/60 active:bg-black/70",
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

export const variantToActiveBorderMap = {
  primary: "active:border-primary focus:border-primary",
  secondary: "active:border-secondary focus:border-secondary",
  info: "active:border-info focus:border-info",
  success: "active:border-success focus:border-success",
  warning: "active:border-warning focus:border-warning",
  danger: "active:border-danger focus:border-danger",
  alert: "active:border-alert focus:border-alert",
  tip: "active:border-tip focus:border-tip",
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
  primary: "hover:text-primary-light",
  secondary: "hover:text-secondary-light",
  info: "hover:text-info-light",
  success: "hover:text-success-light",
  warning: "hover:text-warning-light",
  danger: "hover:text-danger-light",
  alert: "hover:text-alert-light",
  tip: "hover:text-tip-light",
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

export const variantToBgTransparentActiveMap = {
  primary: "active:bg-blue/20",
  secondary: "active:bg-indigo/20",
  info: "active:bg-purple/20",
  success: "active:bg-green/20",
  warning: "active:bg-orange/20",
  danger: "active:bg-red/20",
  alert: "active:bg-yellow/20",
  tip: "active:bg-cyan/20",
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
  light: `from-stone-200 via-stone-300 to-stone-400 ${gradiantClassesBase}`,
  dark: `from-stone-700 via-stone-800 to-stone-900 ${gradiantClassesBase}`,
  white: `from-stone-100 via-white to-white ${gradiantClassesBase}`,
  black: `from-stone-950 via-black to-stone-800 ${gradiantClassesBase}`,
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
  light: `hover:from-stone-200 hover:to-stone-300 ${gradiantClassesBase}`,
  dark: `hover:from-stone-700 hover:to-stone-800 ${gradiantClassesBase}`,
  white: `hover:from-white hover:to-white ${gradiantClassesBase}`,
  black: `hover:from-black hover:to-stone-800 ${gradiantClassesBase}`,
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
  light: `active:from-stone-100 active:to-stone-300 ${gradiantClassesBase}`,
  dark: `active:from-stone-950 active:to-stone-900 ${gradiantClassesBase}`,
  white: `active:from-white active:to-white ${gradiantClassesBase}`,
  black: `active:from-black active:to-black ${gradiantClassesBase}`,
};

export const shadowClassesBase = "shadow-md shadow-opacity-90";

export const variantToHoverShadowMap = {
  primary: `${shadowClassesBase} hover:shadow-blue/40`,
  secondary: `${shadowClassesBase} hover:shadow-indigo/40`,
  info: `${shadowClassesBase} hover:shadow-purple/40`,
  success: `${shadowClassesBase} hover:shadow-green/40`,
  warning: `${shadowClassesBase} hover:shadow-orange/40`,
  danger: `${shadowClassesBase} hover:shadow-red/40`,
  alert: `${shadowClassesBase} hover:shadow-yellow/40`,
  tip: `${shadowClassesBase} hover:shadow-cyan/40`,
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
};

export const variantStyleToButtonStateMap = {
  outline: `${focusRingClassesBase}`,
  inverted: `${focusRingClassesBase}`,
  ghost: `${focusRingClassesBase}`,
  text: `${focusRingClassesBase}`,
};
