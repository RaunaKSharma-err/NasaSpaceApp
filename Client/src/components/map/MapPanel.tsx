import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MapContainer,
  TileLayer,
  Popup,
  LayerGroup,
  Marker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Satellite, Layers, RadioTower } from "lucide-react";
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
const getIconColor = (station: Station) => {
  if (!station.pm25) return "#2c5859";
  const pm25 = station.pm25;
  if (pm25 <= 12) return "green";
  if (pm25 <= 35) return "yellow";
  if (pm25 <= 55) return "orange";
  if (pm25 <= 150) return "red";
  return "purple";
};

const MapPanel = ({ zoom = 7, height = "500px" }) => {
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

  const createLucideIcon = (color: string, size = 20) => {
    const iconMarkup = renderToStaticMarkup(
      <RadioTower color={color} size={size} />
    );

    return L.divIcon({
      html: iconMarkup,
      className: "", // remove default marker styles
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2], // center it
    });
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
                  <Marker
                    key={station.id}
                    position={[station.latitude, station.longitude]}
                    icon={createLucideIcon(getIconColor(station))}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <h4 className="font-medium">{station.name}</h4>
                        <p>Status: Acitive</p>
                      </div>
                    </Popup>
                  </Marker>
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
