import clsx from "clsx";
import { Card } from "../atoms/Card";
import { Icon, IconName } from "../atoms/Icon";
import { Prose } from "./Prose";
import { H3 } from "@garden-co/design-system/src/components/atoms/Headings";

export function FeatureCard({
  label,
  icon,
  explanation,
  children,
  className,
}: {
  label: React.ReactNode;
  icon?: IconName;
  explanation?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={clsx(className, "p-4")}>
      {icon && (
        <Icon
          name={icon}
          intent="primary"
          hasBackground
          className="p-1.5 rounded-lg mb-2.5"
          size="3xl"
        />
      )}
      <H3 className="text-base">{label}</H3>
      {explanation && <Prose>{explanation}</Prose>}
      {children}
    </Card>
  );
}
