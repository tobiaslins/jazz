import { clsx } from "clsx";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import {
  CircleCheckIcon,
  LucideBuilding2,
  LucideCheck,
  LucideCloudDownload,
  LucideCrown,
  LucideDatabase,
  LucideDatabaseZap,
  LucideHammer,
  LucideHandshake,
  LucideIcon,
  LucideInfinity,
  LucideMessageCircle,
  LucideMicroscope,
  LucidePhone,
  LucideSearch,
  LucideTicketCheck,
  LucideUsers,
  LucideZap,
} from "lucide-react";
import { FakeGetStartedButton } from "./FakeGetStartedButton";
import { IndieTierLogo, ProTierLogo, StarterTierLogo } from "./TierLogos";

export function ListItem({
  variant = "blue",
  icon: Icon = CircleCheckIcon,
  className = "",
  children,
}: {
  variant?: "gray" | "blue";
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  const iconSize = 16;

  const iconVariants = {
    gray: <Icon size={iconSize} className="text-stone-500 shrink-0" />,
    blue: (
      <Icon
        size={iconSize}
        className="text-blue-500 dark:text-white shrink-0"
      />
    ),
  };

  return (
    <li
      className={clsx(
        "inline-flex items-center gap-2 text-stone-800 dark:text-stone-200 py-2",
        className,
      )}
    >
      {iconVariants[variant]}
      <span>{children}</span>
    </li>
  );
}

export function Pricing() {
  return (
    <div className="flex flex-col sm:max-w-lg mx-auto md:max-w-none md:flex-row md:items-start gap-4">
      <div className="md:flex-1 flex flex-col gap-3 overflow-hidden rounded-xl p-6 shadow-lg shadow-gray-900/5 bg-white dark:bg-stone-925">
        <h3 className="flex justify-between items-center font-semibold text-stone-900 text-xl dark:text-white">
          <div className="flex items-center gap-1.5">
            <StarterTierLogo />
            Starter
          </div>
          <div className="text-stone-900 dark:text-white">
            <span className="text-2xl font-light tabular-nums tracking-tighter">
              $0
            </span>
            <span className="text-sm font-normal text-stone-600 dark:text-stone-500">
              /mo
            </span>
          </div>
        </h3>

        <p className="text-sm">Everything you need for brand new projects.</p>

        <div>
          <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
            <ListItem icon={LucideUsers}>
              max. 100 monthly active users
            </ListItem>
            <ListItem icon={LucideDatabase}>max. 10 GB storage</ListItem>
            <ListItem icon={LucideCloudDownload}>max. 2 GB egress/mo</ListItem>
          </ul>
        </div>

        <FakeGetStartedButton />

        <p className="text-sm">No credit card required.</p>
      </div>
      <div className="md:flex-1 flex flex-col gap-3 overflow-hidden rounded-xl p-6 shadow-lg shadow-gray-900/5 bg-white dark:bg-stone-925">
        <div>
          <h3 className="flex justify-between items-center font-semibold text-stone-900 text-xl dark:text-white">
            <div className="flex items-center gap-1.5">
              <IndieTierLogo />
              Indie
            </div>
            <div className="text-stone-900 dark:text-white">
              <span className="text-2xl font-light tabular-nums tracking-tighter">
                $4
              </span>
              <span className="text-sm font-normal text-stone-600 dark:text-stone-500">
                /mo
              </span>
            </div>
          </h3>
        </div>

        <p className="text-sm">
          Get robust real-time infra at predictable costs.
        </p>

        <div>
          <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
            <ListItem icon={LucideUsers}>
              max. 10,000 monthly active users
            </ListItem>
            <ListItem icon={LucideDatabase}>
              incl. 100 GB storage{" "}
              <span className="text-sm text-stone-900 dark:text-white">
                (then $0.02 per GB)
              </span>
            </ListItem>
            <ListItem icon={LucideCloudDownload}>
              incl. 20 GB egress/mo{" "}
              <span className="text-sm text-stone-900 dark:text-white">
                (then $0.1 per GB)
              </span>
            </ListItem>
          </ul>
        </div>

        <Button size="md" variant="secondary" disabled>
          Coming soon
        </Button>

        <p className="text-sm">One month free trial.</p>
      </div>
      <div className="md:flex-1 flex flex-col gap-3 overflow-hidden rounded-xl p-6 shadow-lg shadow-gray-900/5 bg-white dark:bg-stone-925 pb-6">
        <h3 className="flex justify-between items-center font-semibold text-stone-900 text-xl dark:text-white">
          <div className="flex items-center gap-1.5">
            <ProTierLogo />
            Pro
          </div>
          <div className="text-stone-900 dark:text-white">
            <span className="text-lg font-normal">from</span>{" "}
            <span className="text-2xl font-light tabular-nums tracking-tighter">
              $199
            </span>
            <span className="text-sm font-normal text-stone-600 dark:text-stone-500">
              /mo
            </span>
          </div>
        </h3>

        <p className="text-sm">
          Get our best infra and move quickly with our help.
        </p>

        <div>
          <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
            <ListItem icon={LucideInfinity}>
              Custom users, storage & egress
            </ListItem>
            <ListItem icon={LucideHandshake}>
              Rapid integration & premium onboarding
            </ListItem>
            <ListItem icon={LucideBuilding2}>
              SLAs, on-prem & certifications
            </ListItem>
          </ul>
        </div>

        <Button href="https://cal.com/anselm-io/cloud-pro-intro" size="md">
          Book intro call
        </Button>

        <p className="text-sm">Our expert team will get you going for free.</p>
      </div>
    </div>
  );
}
