import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, MapPin, Satellite, Navigation } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  LayerGroup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapPanelProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
}

// Mock air quality stations data
const mockStations = [
  {
    id: 1,
    position: [40.7128, -74.006] as [number, number],
    name: "Manhattan Central",
    aqi: 42,
    pm25: 12.5,
    status: "good" as const,
  },
  {
    id: 2,
    position: [40.6892, -74.0445] as [number, number],
    name: "Brooklyn Heights",
    aqi: 68,
    pm25: 18.2,
    status: "moderate" as const,
  },
  {
    id: 3,
    position: [40.7489, -73.9857] as [number, number],
    name: "Queens Plaza",
    aqi: 95,
    pm25: 28.5,
    status: "unhealthy-sensitive" as const,
  },
];

// Helper to get marker color by status
const getStatusColor = (status: string) => {
  switch (status) {
    case "good":
      return "#22c55e"; // green
    case "moderate":
      return "#eab308"; // yellow
    case "unhealthy-sensitive":
      return "#f97316"; // orange
    default:
      return "#6b7280"; // gray
  }
};

const MapPanel = ({
  center = [40.7128, -74.006],
  zoom = 11,
  height = "500px",
}: MapPanelProps) => {
  const [selectedLayers, setSelectedLayers] = useState({
    airQuality: true,
    precipitation: false,
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const toggleLayer = (layer: "airQuality" | "precipitation") => {
    setSelectedLayers({
      ...selectedLayers,
      [layer]: !selectedLayers[layer],
    });
    toggleDropdown();
  };

  return (
    <Card className="w-full bg-gradient-to-br from-card via-card to-card/50 border-border/50 relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span>Environmental Map</span>
        </CardTitle>
        <div className="flex items-center space-x-2 relative">
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            <Satellite className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Button variant="ghost" size="icon" onClick={toggleDropdown}>
            <Layers className="h-4 w-4" />
          </Button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-10 z-50 mt-2 p-3 w-40 bg-card border border-border rounded-lg shadow-md">
              <Button
                variant={selectedLayers.airQuality ? "default" : "ghost"}
                className="w-full justify-start rounded-t-lg"
                onClick={() => toggleLayer("airQuality")}
                style={{marginBottom:5}}
              >
                Air Quality
              </Button>
              <Button
                variant={selectedLayers.precipitation ? "default" : "ghost"}
                className="w-full justify-start rounded-b-lg"
                onClick={() => toggleLayer("precipitation")}
              >
                Precipitation
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          style={{ height }}
          className="relative rounded-b-lg overflow-hidden"
        >
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" ,zIndex:20}}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Air Quality Layer */}
            {selectedLayers.airQuality && (
              <LayerGroup>
                {mockStations.map((station) => (
                  <CircleMarker
                    key={station.id}
                    center={station.position}
                    radius={10}
                    color={getStatusColor(station.status)}
                    fillOpacity={0.6}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <h4 className="font-medium">{station.name}</h4>
                        <p>AQI: {station.aqi}</p>
                        <p>PM2.5: {station.pm25}</p>
                        <p>Status: {station.status}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </LayerGroup>
            )}
          </MapContainer>

          {/* Dynamic Legends */}
          {selectedLayers.airQuality && (
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 z-30">
              <h4 className="text-sm font-medium mb-2 text-foreground">
                Air Quality Index
              </h4>
              <div className="space-y-1 text-xs">
                {[
                  { color: "#22c55e", label: "Good (0-50)" },
                  { color: "#eab308", label: "Moderate (51-100)" },
                  {
                    color: "#f97316",
                    label: "Unhealthy (Sensitive) (101-150)",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full border border-white/50"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedLayers.precipitation && (
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 z-30 mt-20">
              <h4 className="text-sm font-medium mb-2 text-foreground">
                Precipitation
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                  <span>Rain</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  <span>Snow</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPanel;
