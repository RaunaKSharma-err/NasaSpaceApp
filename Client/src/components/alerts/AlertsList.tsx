import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  BellOff,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendEntry {
  date: string;
  value: number;
}

interface CityTrends {
  pm25: TrendEntry[];
  [key: string]: TrendEntry[]; // optional: support other pollutants too
}

interface EnabledCity {
  city: string;
  aqi: number;
  pm25: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  visibility: number;
  uv_index: number;
  precipitation: number;
  trends: CityTrends;
}

interface AlertsListProps {
  enabledCity: EnabledCity; // you can later type this properly
}

interface AlertItem {
  id: string;
  type: "warning" | "info" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  location?: string;
  severity: "low" | "medium" | "high";
  read: boolean;
}

const mockAlerts: AlertItem[] = [
  {
    id: "1",
    type: "warning",
    title: "Air Quality Alert",
    message: "PM2.5 levels have exceeded healthy thresholds in your area",
    timestamp: "2 minutes ago",
    location: "Manhattan, NY",
    severity: "high",
    read: false,
  },
  {
    id: "2",
    type: "info",
    title: "Weather Update",
    message: "Light precipitation expected, which may help improve air quality",
    timestamp: "15 minutes ago",
    location: "New York, NY",
    severity: "low",
    read: false,
  },
  {
    id: "3",
    type: "success",
    title: "Air Quality Improved",
    message: "AQI has returned to good levels in your monitored area",
    timestamp: "1 hour ago",
    location: "Brooklyn, NY",
    severity: "medium",
    read: true,
  },
];

const getAlertIcon = (type: AlertItem["type"]) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-4 w-4" />;
    case "error":
      return <AlertTriangle className="h-4 w-4" />;
    case "info":
      return <Info className="h-4 w-4" />;
    case "success":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getAlertColor = (type: AlertItem["type"]) => {
  switch (type) {
    case "warning":
      return "border-yellow-500/50 bg-yellow-500/10";
    case "error":
      return "border-red-500/50 bg-red-500/10";
    case "info":
      return "border-blue-500/50 bg-blue-500/10";
    case "success":
      return "border-green-500/50 bg-green-500/10";
    default:
      return "border-border bg-card";
  }
};

const getSeverityColor = (severity: AlertItem["severity"]) => {
  switch (severity) {
    case "high":
      return "bg-red-500 text-white";
    case "medium":
      return "bg-yellow-500 text-white";
    case "low":
      return "bg-green-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const AlertsList: React.FC<AlertsListProps> = ({ enabledCity }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Watch PM2.5 trends and generate alerts dynamically
  useEffect(() => {
    if (!enabledCity?.trends?.pm25) return;

    const latestPM25 = enabledCity.trends.pm25.slice(-1)[0]?.value;

    if (!latestPM25) return;

    // Define thresholds (μg/m³)
    let level: "normal" | "moderate" | "high" = "normal";
    if (latestPM25 > 35 && latestPM25 <= 55) level = "moderate";
    else if (latestPM25 > 55) level = "high";

    if (level !== "normal") {
      const newAlert: AlertItem = {
        id: crypto.randomUUID(),
        type: level === "high" ? "error" : "warning",
        title:
          level === "high"
            ? "High Pollution Alert"
            : "Moderate Air Quality Alert",
        message:
          level === "high"
            ? `PM2.5 levels have reached ${latestPM25} µg/m³ — unhealthy conditions detected in ${enabledCity.city}.`
            : `PM2.5 levels are moderate at ${latestPM25} µg/m³ in ${enabledCity.city}.`,
        timestamp: new Date().toLocaleTimeString(),
        location: enabledCity.city ?? "Unknown",
        severity: level === "high" ? "high" : "medium",
        read: false,
      };

      setAlerts((prev) => {
        // Avoid duplicate alerts with the same severity in a short time window
        const recent = prev.find(
          (a) => a.severity === newAlert.severity && a.read === false
        );
        if (recent) return prev;
        return [newAlert, ...prev];
      });
    }
  }, [enabledCity?.trends?.pm25]);

  const filteredAlerts = showOnlyUnread
    ? alerts.filter((alert) => !alert.read)
    : alerts;
  const unreadCount = alerts.filter((alert) => !alert.read).length;

  const markAsRead = (id: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  return (
    <Card className="w-full bg-gradient-to-br from-card via-card to-card/50 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-primary" />
          <span>Real-time Alerts</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-red-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={showOnlyUnread ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowOnlyUnread(!showOnlyUnread)}
          >
            {showOnlyUnread ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            {showOnlyUnread ? "Show All" : "Unread Only"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No alerts to display</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <Alert
              key={alert.id}
              className={cn(
                "relative transition-all duration-300 hover:shadow-md",
                getAlertColor(alert.type),
                !alert.read && "border-l-4 border-l-primary"
              )}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start space-x-3 flex-1">
                  <div
                    className={cn(
                      "p-1.5 rounded-full",
                      alert.type === "warning"
                        ? "text-yellow-600"
                        : alert.type === "error"
                        ? "text-red-600"
                        : alert.type === "info"
                        ? "text-blue-600"
                        : alert.type === "success"
                        ? "text-green-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-foreground text-sm">
                        {alert.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={cn(
                            "text-xs",
                            getSeverityColor(alert.severity)
                          )}
                        >
                          {alert.severity}
                        </Badge>
                        {!alert.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>

                    <AlertDescription className="text-xs text-muted-foreground mb-2">
                      {alert.message}
                    </AlertDescription>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span>{alert.timestamp}</span>
                        {alert.location && <span>📍 {alert.location}</span>}
                      </div>

                      <div className="flex items-center space-x-1">
                        {!alert.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                            className="h-6 px-2 text-xs"
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsList;
