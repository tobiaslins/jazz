"use client";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { HashIcon } from "lucide-react";
import { type ReactNode, useRef } from "react";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children?: ReactNode;
}
export const Heading = ({ children, tag: Tag, ...props }: HeadingProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    <Tag {...props} className="group">
      <div className="absolute hidden sm:block">
        <a
          href={`#${props.id}`}
          className="-ml-6 mt-1.5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Navigate to header"
          ref={linkRef}
        >
          <Icon name="hash" size="sm" />
        </a>
      </div>
      <span className="cursor-pointer" onClick={() => linkRef.current?.click()}>
        {children}
      </span>
    </Tag>
  );
};
