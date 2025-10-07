import { useEffect, useState } from "react";
import ChartPanel, {
  mockHistoricalData,
  mockForecastData,
} from "@/components/charts/ChartPanel";
import DataCard from "@/components/dashboard/DataCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  TrendingUp,
  BarChart3,
  Download,
  Filter,
  Clock,
  Zap,
  Loader,
} from "lucide-react";
import { useAQIStore } from "@/service/api";

const HistoryForecast = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [selectedMetric, setSelectedMetric] = useState("aqi");
  const { fetchEnabledCity } = useAQIStore();
  const [enabledCity, setEnabledCity] = useState(null);
  const [chartData, setchartData] = useState([]);
  const [PeakPM25, setPeakPM25] = useState(0);

  useEffect(() => {
    const loadCity = async () => {
      const city = await fetchEnabledCity();
      setEnabledCity(city);
    };
    loadCity();
  }, []);

  useEffect(() => {
    if (!enabledCity?.trends?.pm25) return;

    const transformed = enabledCity.trends.pm25.map((entry) => ({
      time: new Date(entry.date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      pm25: entry.value,
    }));

    setchartData(transformed);
    setPeakPM25(transformed[transformed.length - 1].pm25);
    const highestPM25 = Math.max(...transformed.map((entry) => entry.pm25));
    setPeakPM25(highestPM25);
    mockHistoricalData[mockHistoricalData.length - 1].aqi = enabledCity?.aqi;
    mockForecastData[mockForecastData.length - 1].aqi = enabledCity?.aqi;
  }, [enabledCity?.trends?.pm25]);

  if (!enabledCity)
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <Loader className="animate-spin" size={30} />
      </div>
    );

  const timeRanges = [
    { label: "24 Hours", value: "24h" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "1 Year", value: "1y" },
  ];

  const metrics = [
    { label: "Air Quality Index", value: "aqi" },
    { label: "PM2.5", value: "pm25" },
    { label: "Temperature", value: "temperature" },
    { label: "Humidity", value: "humidity" },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-stellar bg-clip-text text-transparent mb-4">
            Historical Data & Forecasts
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Analyze trends and predict future air quality conditions using
            advanced atmospheric modeling
          </p>
        </div>

        {/* Time Range and Metric Selection */}
        <Card className="bg-gradient-to-br from-card via-card to-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary" />
              <span>Data Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Time Range
              </label>
              <div className="flex flex-wrap gap-2">
                {timeRanges.map((range) => (
                  <Button
                    key={range.value}
                    variant={
                      selectedTimeRange === range.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedTimeRange(range.value)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Primary Metric
              </label>
              <div className="flex flex-wrap gap-2">
                {metrics.map((metric) => (
                  <Button
                    key={metric.value}
                    variant={
                      selectedMetric === metric.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedMetric(metric.value)}
                  >
                    {metric.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Analysis */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary" />
            Historical Analysis
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <DataCard
              title="Average AQI"
              value={enabledCity?.aqi / 2}
              status="moderate"
              trend="down"
              description="Past 7 days"
            />

            <DataCard
              title="Peak PM2.5"
              value={PeakPM25 ?? 38.54}
              unit="μg/m³"
              status="unhealthy-sensitive"
              trend="up"
              description="Highest recorded"
            />

            <DataCard
              title="Good Air Days"
              value={4}
              unit="of 7"
              status="good"
              trend="stable"
              description="This week"
            />

            <DataCard
              title="Trend Direction"
              value="Improving"
              status="good"
              trend="down"
              description="Overall pattern"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <ChartPanel
              title="Air Quality Trends"
              type="line"
              data={mockHistoricalData}
              dataKeys={["aqi"]}
              colors={["#3b82f6"]}
              height={350}
              trend="up"
            />

            <ChartPanel
              title="Pollutant Levels"
              type="area"
              data={chartData}
              dataKeys={["pm25"]}
              colors={["#8b5cf6"]}
              height={350}
              trend="stable"
            />
          </div>
        </div>

        {/* Forecast Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-primary" />
            5-Day Forecast
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            {mockForecastData.map((forecast, index) => (
              <Card
                key={forecast.day}
                className={`bg-gradient-to-br from-card via-card to-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 ${
                  index === 0 ? "ring-2 ring-primary/20" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-center">
                    {forecast.day}
                    {index === 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-primary/20 text-primary text-xs"
                      >
                        Today
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <div className="text-2xl font-bold text-foreground">
                    {forecast.aqi}
                  </div>
                  <Badge
                    className={`text-xs ${
                      forecast.prediction === "good"
                        ? "bg-aqi-good text-white"
                        : forecast.prediction === "moderate"
                        ? "bg-aqi-moderate text-white"
                        : "bg-aqi-unhealthySensitive text-white"
                    }`}
                  >
                    {forecast.prediction}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    PM2.5: {forecast.pm25} μg/m³
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <ChartPanel
            title="5-Day AQI Forecast"
            type="line"
            data={mockForecastData.map((f) => ({
              time: f.day,
              aqi: f.aqi,
              pm25: f.pm25,
              temperature: 0,
              humidity: 0,
            }))}
            dataKeys={["aqi"]}
            colors={["#10b981"]}
            height={300}
            trend="up"
          />
        </div>

        {/* AI Insights */}
        <Card className="bg-gradient-nebula border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span>AI-Powered Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">
                  Pattern Analysis
                </h4>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li>
                    • Air quality typically improves during weekend due to
                    reduced traffic
                  </li>
                  <li>
                    • Morning hours (6-9 AM) show highest PM2.5 concentrations
                  </li>
                  <li>
                    • Weather patterns suggest improvement over next 48 hours
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Recommendations</h4>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li>• Best outdoor activity window: 10 AM - 2 PM today</li>
                  <li>
                    • Consider indoor activities on Tuesday (forecasted AQI: 95)
                  </li>
                  <li>• Air quality expected to be optimal Wednesday-Friday</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistoryForecast;
