import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Mail,
  Smartphone,
  Settings,
  Plus,
  MapPin,
  Trash2,
  Save,
} from "lucide-react";

interface AlertThreshold {
  id: string;
  parameter: string;
  condition: "above" | "below";
  value: number;
  unit: string;
  enabled: boolean;
}

interface Location {
  id: string;
  name: string;
  coordinates: [number, number];
  enabled: boolean;
}

const AlertSettings = () => {
  const [notifications, setNotifications] = useState({
    inApp: true,
    email: true,
    push: false,
  });

  const [thresholds, setThresholds] = useState<AlertThreshold[]>([
    {
      id: "1",
      parameter: "AQI",
      condition: "above",
      value: 100,
      unit: "",
      enabled: true,
    },
    {
      id: "2",
      parameter: "PM2.5",
      condition: "above",
      value: 25,
      unit: "μg/m³",
      enabled: true,
    },
    {
      id: "3",
      parameter: "Ozone",
      condition: "above",
      value: 120,
      unit: "μg/m³",
      enabled: false,
    },
  ]);

  const [locations, setLocations] = useState<Location[]>([
    {
      id: "1",
      name: "Home - Manhattan, NY",
      coordinates: [40.7128, -74.006],
      enabled: true,
    },
    {
      id: "2",
      name: "Work - Brooklyn, NY",
      coordinates: [40.6892, -74.0445],
      enabled: true,
    },
  ]);

  const [email, setEmail] = useState("user@example.com");

  const toggleThreshold = (id: string) => {
    setThresholds(
      thresholds.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const updateThresholdValue = (id: string, value: number) => {
    setThresholds(thresholds.map((t) => (t.id === id ? { ...t, value } : t)));
  };

  const toggleLocation = (id: string) => {
    setLocations(
      locations.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter((l) => l.id !== id));
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-stellar bg-clip-text text-transparent mb-4">
            Alert Settings
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Configure your notification preferences and thresholds for air
            quality monitoring
          </p>
        </div>

        {/* Notification Channels */}
        <Card className="bg-gradient-to-br from-card via-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Notification Channels</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-foreground">
                      In-App Notifications
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Real-time alerts in the app
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.inApp}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, inApp: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-foreground">
                      Email Alerts
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Notifications via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-foreground">
                      Push Notifications
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Mobile push alerts
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
            </div>

            {notifications.email && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="max-w-md"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert Thresholds */}
        <Card className="bg-gradient-to-br from-card via-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>Alert Thresholds</span>
            </CardTitle>
            <Button variant="stellar" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Threshold
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {thresholds.map((threshold) => (
              <div
                key={threshold.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={threshold.enabled}
                    onCheckedChange={() => toggleThreshold(threshold.id)}
                  />
                  <div className="space-y-1">
                    <h4 className="font-medium text-foreground">
                      {threshold.parameter}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Alert when {threshold.condition} threshold
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={threshold.value}
                      onChange={(e) =>
                        updateThresholdValue(
                          threshold.id,
                          Number(e.target.value)
                        )
                      }
                      className="w-20"
                      disabled={!threshold.enabled}
                    />
                    {threshold.unit && (
                      <span className="text-sm text-muted-foreground">
                        {threshold.unit}
                      </span>
                    )}
                  </div>

                  <Badge
                    variant="secondary"
                    className={
                      threshold.enabled
                        ? "bg-green-500/20 text-green-600"
                        : "bg-muted"
                    }
                  >
                    {threshold.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monitored Locations */}
        <Card className="bg-gradient-to-br from-card via-card to-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Monitored Locations</span>
            </CardTitle>
            <Button variant="stellar" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={location.enabled}
                    onCheckedChange={() => toggleLocation(location.id)}
                  />
                  <div>
                    <h4 className="font-medium text-foreground">
                      {location.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {location.coordinates[0].toFixed(4)},{" "}
                      {location.coordinates[1].toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className={
                      location.enabled
                        ? "bg-green-500/20 text-green-600"
                        : "bg-muted"
                    }
                  >
                    {location.enabled ? "Monitoring" : "Disabled"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLocation(location.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button variant="aurora" size="lg" className="min-w-[200px]">
            <Save className="h-5 w-5 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertSettings;
