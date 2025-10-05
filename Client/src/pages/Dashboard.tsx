import { useState, useEffect } from "react";
import DataCard from "@/components/dashboard/DataCard";
import MapPanel from "@/components/map/MapPanel";
import ChartPanel, { mockHistoricalData } from "@/components/charts/ChartPanel";
import AlertsList from "@/components/alerts/AlertsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer,
  Droplets,
  Wind,
  Eye,
  RefreshCw,
  MapPin,
  Cloud,
  Sun,
  Zap,
  Loader,
} from "lucide-react";
import { useAQIStore } from "@/service/api";

const Dashboard = () => {
  const { fetchEnabledCity } = useAQIStore();
  const [enabledCity, setEnabledCity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState("Birgunj, NP");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const loadCity = async () => {
      const city = await fetchEnabledCity();
      setEnabledCity(city);
    };
    handleRefresh();
    loadCity();
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(async () => {
      const city = await fetchEnabledCity();
      setEnabledCity(city);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1500);
  };

  if (!enabledCity)
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <Loader className="animate-spin" size={30} />
      </div>
    );

  const currentData = {
    aqi: enabledCity.aqi,
    pm25: enabledCity.pm25,
    temperature: enabledCity.temperature,
    humidity: enabledCity.humidity,
    windSpeed: enabledCity.wind_speed,
    visibility: enabledCity.visibility,
    uvIndex: enabledCity.uv_index,
    precipitation: enabledCity.precipitation,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-cosmic py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-aurora bg-clip-text text-transparent mb-4">
              Air Quality Monitor
            </h1>
            <p className="text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
              Real-time environmental monitoring powered by NASA satellite data
              and ground-based sensors
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2 text-foreground/80">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">{location}</span>
              </div>

              <Badge
                variant="secondary"
                className="bg-white/10 text-white border-white/20"
              >
                <Zap className="h-3 w-3 mr-1" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Badge>

              <Button
                variant="aurora"
                onClick={handleRefresh}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Current Conditions Grid */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <Sun className="h-6 w-6 mr-2 text-primary" />
            Current Conditions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DataCard
              title="Air Quality Index"
              value={currentData.aqi}
              status="moderate"
              icon={<Wind className="h-4 w-4" />}
              trend="up"
              description="Moderate for sensitive groups"
            />

            <DataCard
              title="PM2.5"
              value={currentData.pm25}
              unit="μg/m³"
              status="moderate"
              icon={<Cloud className="h-4 w-4" />}
              trend="stable"
              description="Fine particulate matter"
            />

            <DataCard
              title="Temperature"
              value={currentData.temperature}
              unit="°C"
              icon={<Thermometer className="h-4 w-4" />}
              trend="up"
              description="Current ambient temperature"
            />

            <DataCard
              title="Humidity"
              value={currentData.humidity}
              unit="%"
              icon={<Droplets className="h-4 w-4" />}
              trend="down"
              description="Relative humidity"
            />
          </div>
        </div>

        {/* Map and Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Map */}
          <div className="lg:col-span-2">
            <MapPanel height="600px" />
          </div>

          {/* Alerts Panel */}
          <div className="lg:col-span-1">
            <AlertsList />
          </div>
        </div>

        {/* Additional Environmental Data */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <Eye className="h-6 w-6 mr-2 text-primary" />
            Additional Measurements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DataCard
              title="Wind Speed"
              value={currentData.windSpeed}
              unit="km/h"
              icon={<Wind className="h-4 w-4" />}
              description="Current wind conditions"
            />

            <DataCard
              title="Visibility"
              value={currentData.visibility}
              unit="km"
              icon={<Eye className="h-4 w-4" />}
              description="Atmospheric visibility"
            />

            <DataCard
              title="UV Index"
              value={currentData.uvIndex}
              status="moderate"
              icon={<Sun className="h-4 w-4" />}
              description="UV radiation level"
            />

            <DataCard
              title="Precipitation"
              value={currentData.precipitation}
              unit="mm"
              icon={<Droplets className="h-4 w-4" />}
              description="24h precipitation"
            />
          </div>
        </div>

        {/* Recent Trends Chart */}
        <div>
          <ChartPanel
            title="24-Hour Air Quality Trends"
            type="area"
            data={mockHistoricalData}
            dataKeys={["aqi", "pm25"]}
            colors={["#3b82f6", "#8b5cf6"]}
            height={350}
            trend="up"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
