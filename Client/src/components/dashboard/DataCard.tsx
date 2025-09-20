import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DataCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status?:
    | "good"
    | "moderate"
    | "unhealthy-sensitive"
    | "unhealthy"
    | "very-unhealthy"
    | "hazardous";
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  description?: string;
}

const getStatusColor = (status?: DataCardProps["status"]) => {
  switch (status) {
    case "good":
      return "bg-aqi-good text-white";
    case "moderate":
      return "bg-aqi-moderate text-white";
    case "unhealthy-sensitive":
      return "bg-aqi-unhealthySensitive text-white";
    case "unhealthy":
      return "bg-aqi-unhealthy text-white";
    case "very-unhealthy":
      return "bg-aqi-veryUnhealthy text-white";
    case "hazardous":
      return "bg-aqi-hazardous text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const DataCard = ({
  title,
  value,
  unit,
  status,
  icon,
  trend,
  description,
}: DataCardProps) => {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-cosmic">
      <div className="absolute inset-0 bg-gradient-cosmic opacity-5"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-end space-x-2">
          <div className="text-2xl font-bold text-foreground">
            {value}
            {unit && (
              <span className="text-lg text-muted-foreground ml-1">{unit}</span>
            )}
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center text-xs",
                trend === "up"
                  ? "text-red-400"
                  : trend === "down"
                  ? "text-green-400"
                  : "text-muted-foreground"
              )}
            >
              {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {status && (
            <Badge
              className={cn("text-xs font-medium", getStatusColor(status))}
            >
              {status
                .replace("-", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataCard;
