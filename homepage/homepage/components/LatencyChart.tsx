"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";

const ranges = [
  {
    from: 0,
    className: "bg-green-400",
  },
  {
    from: 50,
    className: "bg-green-500",
  },
  {
    from: 100,
    className: "bg-green-600",
  },
  {
    from: 250,
    className: "bg-green-700",
  },
  {
    from: 500,
    className: "bg-green-800",
  },
  {
    from: 750,
    className: "bg-green-900",
  },
  {
    from: 1500,
    className: "bg-green-950",
  },
  {
    from: 3000,
    className: "bg-[#ff001e]",
  },
];
interface Props {
  intervalMin: number;
  latencyOverTime: [number[], number[]];
  upOverTime: [number[], number[]];
  upCountOverTime: [number[], number[]];
}
export default function LatencyChart({ latencyOverTime, upOverTime, upCountOverTime, intervalMin }: Props) {
  const series = useMemo(() => {
    return latencyOverTime[1].map((value, index) => ({
      ts: latencyOverTime[0][index],
      value: Math.round(value),
      up: upOverTime[1][index],
      upCount: upCountOverTime[1][index],
    }));
  }, [latencyOverTime, upOverTime]);

  return (
    <figure className="flex items-stretch w-full justify-end">
      <HoverCard.Root openDelay={0} closeDelay={0}>
        <HoverCard.Trigger asChild>
          <div
            className={cn(
              "rounded-md grow hover:opacity-50 dark:bg-gray-900 bg-gray-200",
            )}
          />
        </HoverCard.Trigger>
        <HoverCard.Content className="border border-stone-500 bg-white dark:bg-black shadow-lg absolute w-[150px] -ml-[75px] l-[50%] rounded-md p-2">
          <HoverCard.Arrow className="fill-stone-500" />
          <p>
            <span className="font-semibold">No data</span>
          </p>
        </HoverCard.Content>
      </HoverCard.Root>
      {series.map(({ value, ts, up, upCount }) => {
        const valueClass = getClassForLatencyAndUp(value, up / upCount);

        const downtimeMin = (1 - up / upCount) * intervalMin;
        return (
          <HoverCard.Root key={ts} openDelay={0} closeDelay={0}>
            <HoverCard.Trigger asChild >
              <div className="p-[0.5px]">
                <div
                  className={cn(
                    "h-4 w-1 lg:w-2 rounded-sm hover:opacity-50",
                    valueClass,
                  )}
                />
              </div>
            </HoverCard.Trigger>
            <HoverCard.Content className="border border-stone-500 bg-white dark:bg-black shadow-lg absolute w-[150px] -ml-[75px] l-[50%] rounded-md p-2">
              <HoverCard.Arrow className="fill-stone-500" />

              <time
                className="text-xs"
                dateTime={new Date(ts).toISOString()}
              >
                {new Date(ts).toLocaleString()}
              </time>
              <p className="text-sm text-right">
                <span
                  className={cn(
                    "rounded-md size-3 inline-block mr-1",
                    getClassForLatencyAndUp(value, 1),
                  )}
                />
                <span className="font-semibold">{value}</span> ms
              </p>
              <p className="text-sm text-right">
                <span
                  className={cn(
                    "rounded-md size-3 inline-block mr-1",
                    getClassForLatencyAndUp(0, up / upCount),
                  )}
                />
                <span className="font-semibold">{Math.round(downtimeMin)}/{intervalMin}min</span> down
              </p>                </HoverCard.Content>
          </HoverCard.Root>
        );
      })}
    </figure>
  );
}

function getClassForLatencyAndUp(value: number, up: number) {
  if (up >= 0.99) {
    for (let i = 0; i < ranges.length; i++) {
      const { from } = ranges[i];
      if (value < from) {
        return ranges[i - 1].className;
      }
    }
  } else if (up >= 0.9) {
    return "bg-yellow-400";
  } else if (up >= 0.8) {
    return "bg-orange-500";
  }

  return "bg-[#ff001e]";
}
