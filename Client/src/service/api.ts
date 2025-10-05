import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-toastify";

export type Pollutants = {
  pm25?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  co?: number;
  so2?: number;
  [key: string]: number | undefined;
};

export type Weather = {
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  visibility?: number;
  uv_index?: number;
  precipitation?: number;
};

export type Trend = {
  date: string;
  value: number;
};

export type AQIData = {
  city: string;
  aqi: number;
  pollutants: Pollutants;
  weather: Weather;
  trends: Trend[];
};

export type City = {
  id: number;
  city: string;
  aqi: number;
  pollutants?: Pollutants;
  weather?: Weather;
  trends: Trend[] | null;
  created_at: string;
  lat: number;
  lon: number;
  pm25: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  visibility: number;
  uv_index: number;
  precipitation: number;
  enabled?: boolean;
};

type AQIStore = {
  cityDetails: AQIData | null;
  cities: City[] | null;
  currentCity:City | null;

  toggleLocation:(id:number)=>Promise<void>;
  fetchEnabledCity: () => Promise<void>;
  addCity: (city: string) => Promise<void>;
  getCities: () => Promise<void>;
  getCity: (city: string) => Promise<void>;
  getCityTrends: (city: string) => Promise<void>;
  getCitiesByCountry: (country: string) => Promise<void>;
  deleteCity: (city: string) => Promise<void>;
};

export const useAQIStore = create<AQIStore>((set, get) => ({
  cityDetails: null,
  cities: null,
  currentCity: null,

  addCity: async (city: string) => {
    try {
      const response = await axiosInstance.post<AQIData>("/add-city", { city });
      set({ cityDetails: response.data });
      console.log("City added:", response.data);
    } catch (error) {
      console.error("Error adding city:", error);
    }
  },

  getCities: async () => {
    try {
      const response = await axiosInstance.get<City[]>("/cities");
      set({ cities: response.data });
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  },

  getCity: async (city: string) => {
    try {
      const response = await axiosInstance.get<AQIData>(`/city/${city}`);
      set({ cityDetails: response.data });
    } catch (error) {
      console.error(`Error fetching city ${city}:`, error.message);
    }
  },

  getCityTrends: async (city: string) => {
    try {
      const response = await axiosInstance.get<{ trends: Trend[] }>(
        `/city/${city}/trends`
      );
      set((state) => ({
        cityDetails: state.cityDetails
          ? { ...state.cityDetails, trends: response.data.trends }
          : null,
      }));
    } catch (error) {
      console.error(`Error fetching trends for ${city}:`, error);
    }
  },

  getCitiesByCountry: async (country: string) => {
    try {
      const response = await axiosInstance.get<City[]>(`/countries/${country}`);
      set({ cities: response.data });
    } catch (error) {
      console.error(`Error fetching cities for country ${country}:`, error);
    }
  },

  deleteCity: async (city: string) => {
    try {
      await axiosInstance.delete(`/city/${city}`);
      set((state) => ({
        cities: state.cities?.filter((c) => c.city !== city) || null,
      }));
      console.log(`City ${city} deleted`);
    } catch (error) {
      console.error(`Error deleting city ${city}:`, error);
    }
  },

 toggleLocation: async (id: number) => {
    try {
      // Call backend to enable this city
      await axiosInstance.post("/enable-city", { cityId: id });
      // Refresh cities list
      await get().getCities();
      // Refresh current enabled city
      await get().fetchEnabledCity();
    } catch (err) {
      console.error("Error toggling city:", err);
    }
  },

  fetchEnabledCity: async () => {
  try {
    const response = await axiosInstance.get("/enabled-city");
    set({ currentCity: response.data });
    return response.data;
  } catch (err) {
    console.error("Error fetching enabled city:", err);
  }
},

}));
