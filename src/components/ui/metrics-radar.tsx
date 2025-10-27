import { DerivedMetrics } from "../../../server/types";
import { Card } from "./card";
import {
  LineChart,
  Line,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Radar,
  RadarChart,
} from "recharts";

interface MetricsRadarProps {
  metrics: Partial<DerivedMetrics>;
  title?: string;
  className?: string;
}

export function MetricsRadar({ metrics, title, className }: MetricsRadarProps) {
  const metricsData = [
    { name: "Vision", value: metrics.vision || 0 },
    { name: "Farming", value: metrics.farming || 0 },
    { name: "Roaming", value: metrics.roaming || 0 },
    { name: "Aggression", value: metrics.aggression || 0 },
    { name: "Teamfighting", value: metrics.teamfighting || 0 },
  ];

  return (
    <Card className={className}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 px-6 pt-6">{title}</h3>
      )}
      <div className="w-full h-[300px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={metricsData}>
            <PolarGrid />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Metrics"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}