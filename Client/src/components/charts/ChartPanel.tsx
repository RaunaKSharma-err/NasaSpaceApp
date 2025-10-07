import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, CloudOff } from "lucide-react";

interface ChartData {
  time: string;
  aqi: number;
  pm25: number;
  temperature: number;
  humidity: number;
}

interface ChartPanelProps {
  title: string;
  type: "line" | "area";
  data: ChartData[];
  dataKeys: string[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  trend?: "up" | "down" | "stable";
}

interface TooltipPayloadEntry {
  name: string;
  value: string | number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

// Mock historical data
const mockHistoricalData = [
  { time: "00:00", aqi: 42, pm25: 12.5, temperature: 22, humidity: 65 },
  { time: "04:00", aqi: 38, pm25: 11.2, temperature: 20, humidity: 68 },
  { time: "08:00", aqi: 55, pm25: 16.8, temperature: 24, humidity: 62 },
  { time: "12:00", aqi: 68, pm25: 19.5, temperature: 28, humidity: 58 },
  { time: "16:00", aqi: 72, pm25: 21.2, temperature: 30, humidity: 55 },
  { time: "20:00", aqi: 48, pm25: 14.8, temperature: 26, humidity: 60 },
];

const mockForecastData = [
  { day: "Today", aqi: 68, pm25: 19.5, prediction: "moderate" },
  { day: "Tomorrow", aqi: 45, pm25: 13.2, prediction: "good" },
  { day: "Day 3", aqi: 52, pm25: 15.8, prediction: "moderate" },
  { day: "Day 4", aqi: 38, pm25: 11.5, prediction: "good" },
  { day: "Day 5", aqi: 41, pm25: 12.8, prediction: "moderate" },
];

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg backdrop-blur-sm bg-card/90">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.dataKey === "aqi"
              ? ""
              : entry.dataKey === "pm25"
              ? " μg/m³"
              : entry.dataKey === "temperature"
              ? "°C"
              : entry.dataKey === "humidity"
              ? "%"
              : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChartPanel = ({
  title,
  type,
  data,
  dataKeys,
  colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"],
  height = 300,
  showLegend = true,
  trend,
}: ChartPanelProps) => {
  const ChartComponent = type === "area" ? AreaChart : LineChart;

  return (
    <Card className="w-full bg-gradient-to-br from-card via-card to-card/50 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
        {trend && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-red-400" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3 text-green-400" />
            ) : (
              <Activity className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-xs capitalize">{trend}</span>
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {data.length === 0 ? (
            <p>
              Sensor in your location could not povide data <CloudOff />
            </p>
          ) : (
            <ChartComponent
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}

              {dataKeys.map((key, index) => {
                const color = colors[index] || colors[0];
                return type === "area" ? (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name={key.toUpperCase()}
                  />
                ) : (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                    name={key.toUpperCase()}
                  />
                );
              })}
            </ChartComponent>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Export mock data for use in pages
export { mockHistoricalData, mockForecastData };
export default ChartPanel;
