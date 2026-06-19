'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button-1';
import { Card, CardContent, CardHeader, CardTitle, CardToolbar } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-4';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Download, Filter, MoreHorizontal, RefreshCw, Share2 } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

const chartConfig = {
  views: {
    label: 'Total Views',
    color: '#6366f1', // Pulse Indigo
  },
  visitors: {
    label: 'Unique Visitors',
    color: '#a855f7', // Pulse Purple
  },
} satisfies ChartConfig;

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const ChartLabel = ({ label, color }: { label: string; color: string }) => {
  return (
    <div className="flex items-center gap-1.5">
      <div className="size-3.5 border-4 rounded-full bg-zinc-900" style={{ borderColor: color }}></div>
      <span className="text-zinc-400">{label}</span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-zinc-900/90 backdrop-blur-md p-3 shadow-sm min-w-[150px]">
        <div className="text-xs font-medium text-zinc-400 tracking-wide mb-2.5">{label}</div>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            const config = chartConfig[entry.dataKey as keyof typeof chartConfig];
            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                <ChartLabel label={config?.label + ':'} color={entry.color} />
                <span className="font-semibold text-white ml-auto">{entry.value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const ChartLegend = ({ label, color }: { label: string; color: string }) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className="size-3.5 border-4 rounded-full bg-zinc-900"
        style={{ borderColor: color }}
      ></div>
      <span className="text-sm text-zinc-400">{label}</span>
    </div>
  );
};

export default function AnalyticsChart({ totalViews = 0 }: { totalViews?: number }) {
  const chartData = useMemo(() => {
    const data = [];
    const now = Date.now();
    const views = totalViews || 0;

    if (views === 0) {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        data.push({ 
          time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
          views: 0, 
          visitors: 0 
        });
      }
      return data;
    }

    let currentViews = Math.max(1, Math.floor(views * 0.4));
    const dailyAverage = (views - currentViews) / 29;

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      
      if (i === 0) {
         currentViews = views;
      } else if (i < 29) {
         currentViews += dailyAverage * (Math.random() * 1 + 0.5);
      }

      if (currentViews > views) currentViews = views - 1;

      data.push({
        time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: Math.floor(currentViews),
        visitors: Math.floor(currentViews * 0.65)
      });
    }

    return data;
  }, [totalViews]);

  return (
    <div className="w-full flex items-center justify-center pt-8">
      <Card className="w-full bg-transparent border-0 shadow-none">
        <CardHeader className="border-0 pt-0 pb-6 px-0 flex-row justify-between">
          <CardTitle className="text-lg font-semibold text-white">Audience Growth</CardTitle>
          <CardToolbar>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Change Date
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardToolbar>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <ChartContainer
            config={chartConfig}
            className="h-[300px] w-full mb-8 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-white/10"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="4 8"
                stroke="rgba(255,255,255,0.05)"
                strokeOpacity={1}
                horizontal={true}
                vertical={false}
              />

              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                tickMargin={12}
                minTickGap={30}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                tickFormatter={(value) => `${value.toLocaleString()}`}
                tickMargin={12}
              />

              <ChartTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />

              <Line 
                dataKey="views" 
                type="monotone" 
                stroke={chartConfig.views.color} 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4, strokeWidth: 0, fill: chartConfig.views.color }}
              />

              <Line 
                dataKey="visitors" 
                type="monotone" 
                stroke={chartConfig.visitors.color} 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4, strokeWidth: 0, fill: chartConfig.visitors.color }}
              />
            </LineChart>
          </ChartContainer>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <ChartLegend label="Total Views" color={chartConfig.views.color} />
            <ChartLegend label="Unique Visitors" color={chartConfig.visitors.color} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}