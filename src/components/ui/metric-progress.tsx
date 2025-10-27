import { Progress } from "./progress";

interface MetricProgressProps {
  label: string;
  value: number;
  description?: string;
  className?: string;
}

export function MetricProgress({
  label,
  value,
  description,
  className,
}: MetricProgressProps) {
  return (
    <div className={className}>
      <div className="flex justify-between items-baseline mb-2">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">{label}</h4>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}