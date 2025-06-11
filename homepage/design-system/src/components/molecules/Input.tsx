import { clsx } from "clsx";
import { forwardRef, useId } from "react";
import { Icon, icons } from "../atoms/Icon";
import { Label } from "../atoms/Label";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  id?: string;
  placeholder?: string;
  icon?: keyof typeof icons;
  iconPosition?: "left" | "right";
  labelHidden?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      className,
      id: customId,
      placeholder,
      icon,
      iconPosition,
      labelHidden,
      ...inputProps
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;

    const inputClassName = clsx(
      "w-full rounded-md border px-3.5 py-2 shadow-sm",
      "font-medium text-stone-900",
      "dark:text-white dark:bg-stone-925",
    );

    return (
      <div className="relative w-full">
        <Label
          label={label}
          htmlFor={id}
          className={labelHidden ? "sr-only" : ""}
        />
        <input
          ref={ref}
          {...inputProps}
          id={id}
          className={clsx(
            inputClassName,
            iconPosition === "left"
              ? "pl-9"
              : iconPosition === "right"
                ? "pr-9"
                : "",
            className,
          )}
          placeholder={placeholder}
        />
        {icon && (
          <Icon
            name={icon}
            className={clsx(
              "absolute",
              iconPosition === "left"
                ? "left-2"
                : iconPosition === "right"
                  ? "right-2"
                  : "",
              labelHidden ? "top-[0.6rem]" : "top-1/2",
            )}
          />
        )}
      </div>
    );
  },
);
