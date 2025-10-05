import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  LayerGroup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Satellite, Layers } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { axiosInstance } from "@/lib/axios";

interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  aqi?: number;
  pm25?: number;
  status?: string;
}

const getStatusColor = (aqiStatus?: string) => {
  switch (aqiStatus) {
    case "good":
      return "#22c55e";
    case "moderate":
      return "#eab308";
    case "unhealthy-sensitive":
      return "#f97316";
    default:
      return "#6b7280";
  }
};

const MapPanel = ({ zoom = 5, height = "500px" }) => {
  const mapRef = useRef<L.Map>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedLayers, setSelectedLayers] = useState({
    airQuality: true,
    precipitation: false,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleLayer = (layer: "airQuality" | "precipitation") => {
    setSelectedLayers({ ...selectedLayers, [layer]: !selectedLayers[layer] });
    toggleDropdown();
  };

  const map = mapRef.current;
  useEffect(() => {
    if (!map) return;

    // fetch initial stations
    fetchStations(map.getBounds());

    // fetch stations on move
    map.on("moveend", () => {
      fetchStations(map.getBounds());
    });
  }, [map]);

  const fetchStations = async (bounds: L.LatLngBounds) => {
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    try {
      const res = await axiosInstance.get(
        `/stations?minLat=${southWest.lat}&maxLat=${northEast.lat}&minLng=${southWest.lng}&maxLng=${northEast.lng}`
      );

      const data = res.data; // <-- Axios automatically parses JSON

      if (Array.isArray(data.stations)) {
        setStations(data.stations);
      } else if (Array.isArray(data)) {
        setStations(data);
      } else {
        setStations([]);
      }
    } catch (err) {
      console.error("Error fetching stations:", err);
      setStations([]);
    }
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
          {dropdownOpen && (
            <div className="absolute right-0 top-10 z-50 mt-2 p-3 w-40 bg-card border border-border rounded-lg shadow-md">
              <Button
                variant={selectedLayers.airQuality ? "default" : "ghost"}
                className="w-full justify-start rounded-t-lg"
                onClick={() => toggleLayer("airQuality")}
                style={{ marginBottom: 5 }}
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
            center={[27.0449, 84.8672] as [number, number]}
            zoom={zoom}
            style={{ height: "100%", width: "100%", zIndex: 40 }}
            scrollWheelZoom={true}
            zoomControl={false}
            ref={mapRef}
            whenReady={() => {
              if (!mapRef.current) return;

              const map = mapRef.current;

              // initial fetch
              fetchStations(map.getBounds());

              // fetch on move
              map.on("moveend", () => {
                fetchStations(map.getBounds());
              });
            }}
          >
            <TileLayer
              attribution=""
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedLayers.airQuality && (
              <LayerGroup>
                {stations.map((station) => (
                  <CircleMarker
                    key={station.id}
                    center={
                      [station.latitude, station.longitude] as [number, number]
                    }
                    radius={5}
                    color={getStatusColor(station.status)}
                    fillOpacity={0.6}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <h4 className="font-medium">{station.name}</h4>
                        {station.aqi && <p>AQI: {station.aqi}</p>}
                        {station.pm25 && <p>PM2.5: {station.pm25}</p>}
                        <p>Status: {station.status}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </LayerGroup>
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapPanel;
