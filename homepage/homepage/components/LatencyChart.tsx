"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface Props {
  data: [number[], number[]];
}
export function LatencyChart({ data }: Props) {
  const series = useMemo(() => {
    return {
      name: "Latency",
      data: data[1].map((value) => Math.round(value)),
    } satisfies ApexAxisChartSeries[number];
  }, [data]);

  const options = {
    grid: {
      show: false,
    },
    stroke: {
      show: false,
    },
    chart: {
      animations: {
        enabled: false,
      },
      type: "heatmap",
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    title: {
      text: "",
    },
    xaxis: {
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      show: false,
    },
    tooltip: {
      theme: "",
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const latency = series[seriesIndex][dataPointIndex];
        const date = new Date(data[0][dataPointIndex]).toLocaleString();

        return `
<div>
  <span class="text-xs">${date}</span><br/>
  <span><span class="font-semibold text-stone-900 dark:text-white">${latency}</span> ms</span><br/>
</div>
        `;
      },
      cssClass: "g-apexcharts-tooltip",
    },
    plotOptions: {
      heatmap: {
        radius: 0,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 10,
              color: "#1ae200",
            },
            {
              from: 10,
              to: 50,
              color: "#32c119",
            },
            {
              from: 50,
              to: 100,
              color: "#62bd56",
            },
            {
              from: 100,
              to: 200,
              color: "#4c8944",
            },
            {
              from: 200,
              to: 300,
              color: "#3b6537",
            },
            {
              from: 300,
              to: 400,
              color: "#405b3d",
            },
            {
              from: 400,
              to: 500,
              color: "#395335",
            },
            {
              from: 500,
              to: 750,
              color: "#283e2b",
            },
            {
              from: 750,
              to: 1000,
              color: "#1e2a1d",
            },
            {
              from: 1000,
              to: 3000,
              color: "#162018",
            },
            {
              from: 3000,
              to: Number.POSITIVE_INFINITY,
              color: "#ff001e",
            },
          ],
        },
      },
    },
  } satisfies ApexOptions;

  return (
    <ReactApexChart
      options={options}
      series={[series]}
      type="heatmap"
      width={900}
      height={100}
    />
  );
}
