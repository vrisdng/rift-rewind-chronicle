import type { DerivedMetrics } from "../../../server/types";
import { Card } from "./card";
import {
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Radar,
  RadarChart,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { Eye, Flame, Navigation, Users, Wheat, type LucideIcon } from "lucide-react";

type MetricKey = "vision" | "farming" | "roaming" | "aggression" | "teamfighting";

type MetricDefinition = {
  key: MetricKey;
  label: string;
  icon: LucideIcon;
  description: string;
};

type MetricDatum = MetricDefinition & { value: number };

const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: "vision",
    label: "Vision",
    icon: Eye,
    description: "Map awareness, warding cadence, and denial of enemy vision.",
  },
  {
    key: "farming",
    label: "Farming",
    icon: Wheat,
    description: "CS efficiency and how consistently you secure lane resources.",
  },
  {
    key: "roaming",
    label: "Roaming",
    icon: Navigation,
    description: "Cross-map impact through rotations and objective presence.",
  },
  {
    key: "aggression",
    label: "Aggression",
    icon: Flame,
    description: "Kill pressure, damage-first plays, and skirmish initiative.",
  },
  {
    key: "teamfighting",
    label: "Teamfighting",
    icon: Users,
    description: "Execution and positioning when grouped with your team.",
  },
];

const MetricTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0]?.payload as MetricDatum | undefined;
  if (!datum) {
    return null;
  }

  const Icon = datum.icon;

  return (
    <div className="rounded-xl border border-border/60 bg-background/85 px-4 py-3 text-left shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#C8AA6E]" />
        <p className="text-sm font-semibold text-white">{datum.label}</p>
        <span className="ml-auto text-sm text-[#C8AA6E]">{Math.round(datum.value)}%</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{datum.description}</p>
    </div>
  );
};

interface MetricsRadarProps {
  metrics: Partial<DerivedMetrics>;
  title?: string;
  className?: string;
}

export function MetricsRadar({ metrics, title, className }: MetricsRadarProps) {
  const metricsData: MetricDatum[] = METRIC_DEFINITIONS.map((definition) => ({
    ...definition,
    value: Number(metrics[definition.key as keyof DerivedMetrics] ?? 0),
  }));

  const renderIconTick = ({
    x,
    y,
    payload,
    cx,
    cy,
  }: {
    x: number;
    y: number;
    cx: number;
    cy: number;
    payload: { value: string };
  }) => {
    const datum = metricsData.find((metric) => metric.label === payload.value);
    if (!datum) {
      return null;
    }

    const Icon = datum.icon;
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const offset = 24;
    const offsetX = x + (dx / distance) * offset;
    const offsetY = y + (dy / distance) * offset;

    return (
      <g transform={`translate(${offsetX - 12}, ${offsetY - 12})`}>
        <Icon className="h-6 w-6 text-[#C8AA6E]" />
      </g>
    );
  };

  return (
    <Card className={className}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 px-6 pt-6">{title}</h3>
      )}
      <div className="w-full h-[300px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={metricsData} cx="50%" cy="55%">
            <PolarGrid />
            <PolarAngleAxis
              dataKey="label"
              tick={renderIconTick}
              tickLine={false}
              axisLine={false}
            />
            <Radar
              name="Metrics"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
            <Tooltip
              cursor={{ fill: "rgba(200, 170, 110, 0.08)" }}
              content={<MetricTooltip />}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
