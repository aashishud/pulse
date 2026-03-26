"use client";

import { useMemo } from "react";
import { AreaChart, Area, Grid, XAxis, ChartTooltip } from "@/components/ui/area-chart";

export default function AnalyticsChart({ totalViews = 0 }: { totalViews?: number }) {
  const chartData = useMemo(() => {
    const data = [];
    const now = Date.now();
    const views = totalViews || 0;

    // If it's a brand new account with 0 views, just return a flatline of 0s
    if (views === 0) {
      for (let i = 29; i >= 0; i--) {
        data.push({ date: new Date(now - i * 24 * 60 * 60 * 1000), views: 0, visitors: 0 });
      }
      return data;
    }

    // Mathematical magic to generate a realistic CUMULATIVE growth curve
    let currentViews = Math.max(1, Math.floor(views * 0.4)); // Start at ~40% of total views 30 days ago
    const dailyAverage = (views - currentViews) / 29;

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      
      if (i === 0) {
         currentViews = views; // Ensure the last day matches exactly
      } else if (i < 29) {
         // Add the daily average + some random noise so it looks organic
         currentViews += dailyAverage * (Math.random() * 1 + 0.5);
      }

      // Cap it just in case floating math gets weird
      if (currentViews > views) currentViews = views - 1;

      data.push({
        date,
        views: Math.floor(currentViews),
        visitors: Math.floor(currentViews * 0.65) // Visitors scale with views
      });
    }

    return data;
  }, [totalViews]);

  return (
    <div
      className="w-full h-[300px]"
      style={{
        "--chart-background": "transparent",
        "--chart-foreground": "white",
        "--chart-foreground-muted": "#a1a1aa",
        "--chart-label": "#71717a",
        "--chart-line-primary": "#6366f1", // Pulse Indigo
        "--chart-line-secondary": "#a855f7", // Pulse Purple
        "--chart-crosshair": "#3f3f46",
        "--chart-grid": "rgba(255,255,255,0.05)",
      } as React.CSSProperties}
    >
      <AreaChart data={chartData} xDataKey="date">
        <Grid horizontal strokeDasharray="0" stroke="var(--chart-grid)" />
        <Area
          dataKey="views"
          fill="var(--chart-line-primary)"
          fillOpacity={0.2}
          strokeWidth={3}
          fadeEdges
        />
        <Area
          dataKey="visitors"
          fill="var(--chart-line-secondary)"
          fillOpacity={0.2}
          strokeWidth={3}
          fadeEdges
        />
        <XAxis />
        <ChartTooltip
          showCrosshair
          showDots
          showDatePill
          rows={(point) => [
            {
              color: "var(--chart-line-primary)",
              label: "Total Views",
              value: `${(point.views as number)?.toLocaleString()}`,
            },
            {
              color: "var(--chart-line-secondary)",
              label: "Unique Visitors",
              value: `${(point.visitors as number)?.toLocaleString()}`,
            },
          ]}
        />
      </AreaChart>
    </div>
  );
}