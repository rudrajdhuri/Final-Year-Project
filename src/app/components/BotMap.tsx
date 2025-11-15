"use client";

import { useEffect, useState } from "react";
import { MapPin, Battery, Activity } from "lucide-react";
import { useFieldData, getCropColor } from "../hooks/useFieldData";

interface BotLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  battery: number;
  status: "active" | "charging" | "maintenance";
  task: string;
  speed: string;
  lastUpdate: string;
}

export default function BotMap() {
  const [botLocations, setBotLocations] = useState<BotLocation[]>([]);
  const [selectedBot, setSelectedBot] = useState<BotLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const {
    fieldData = [],
    loading: fieldsLoading,
    error: fieldsError,
  } = useFieldData(userLocation || undefined);

  // ========== GET USER LOCATION ==========
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported.");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLoadingLocation(false);

        // Add user as a bot for UI
        const userBot: BotLocation = {
          id: "USER-LOCATION",
          name: "Your Location",
          lat: latitude,
          lng: longitude,
          battery: 100,
          status: "active",
          task: "GPS Live",
          speed: "0 m/s",
          lastUpdate: "Now",
        };

        setBotLocations((prev) => [...prev.filter((b) => b.id !== "USER-LOCATION"), userBot]);
      },
      () => {
        setLocationError("Unable to fetch location.");
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ========== STATIC BOTS ==========
 function generateBotLocations(): BotLocation[] {
  return [
    {
      id: "bot1",
      name: "AgriBot A1",
      lat: 15.345,
      lng: 73.923,
      battery: 82,
      status: "active",       // <-- lowercase and valid
      task: "Spraying",
      speed: "1.4 m/s",
      lastUpdate: new Date().toISOString(),
    },
    {
      id: "bot2",
      name: "AgriBot B2",
      lat: 15.348,
      lng: 73.920,
      battery: 45,
      status: "charging",     // <-- must match union type
      task: "Docked",
      speed: "0 m/s",
      lastUpdate: new Date().toISOString(),
    },
  ];
}


  // ========== INITIAL LOAD ==========
  useEffect(() => {
    setBotLocations(generateBotLocations());
    getUserLocation();

    const interval = setInterval(() => {
      setBotLocations((bots) =>
        bots.map((b) => ({
          ...b,
          battery:
            b.id === "USER-LOCATION"
              ? 100
              : b.status === "charging"
              ? Math.min(100, b.battery + 1)
              : Math.max(0, b.battery - 0.2),
          lastUpdate: "Just now",
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ========== STATUS COLOR ==========
  const getStatusColor = (status: string, isUser = false) => {
    if (isUser) return "bg-blue-500";
    if (status === "active") return "bg-green-500";
    if (status === "charging") return "bg-yellow-500";
    return "bg-red-500";
  };

  // ================================================================
  // ========================== RENDER ===============================
  // ================================================================
  return (
    <div className="h-96 bg-gray-800 rounded-lg relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-90 bg-green-900"></div>

      {/* FIELD OVERLAY */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        {fieldData.map((field, index) => {
          const cx = 20 + (index % 4) * 20;
          const cy = 20 + Math.floor(index / 4) * 20;

          return (
            <g key={field.id}>
              <rect
                x={cx}
                y={cy}
                width="12"
                height="12"
                fill={getCropColor(field.cropType, field.ndviValue)}
                stroke="white"
                strokeWidth="0.5"
                onClick={() =>
                  setSelectedBot({
                    id: field.id,
                    name: field.name,
                    lat: field.coordinates[0].lat,
                    lng: field.coordinates[0].lng,
                    battery: field.soilHealth,
                    status: "active",
                    task: field.currentStage,
                    speed: `${field.yieldPrediction} bu/ac`,
                    lastUpdate: field.plantingDate,
                  })
                }
              />
              <text x={cx + 6} y={cy + 6} fontSize="3" fill="white" textAnchor="middle">
                🌾
              </text>
            </g>
          );
        })}
      </svg>

      {/* BOT MARKERS */}
      {botLocations.map((bot, index) => {
        const isUser = bot.id === "USER-LOCATION";
        const x = isUser ? 50 : 20 + (index % 4) * 20;
        const y = isUser ? 50 : 20 + Math.floor(index / 4) * 20;

        return (
          <div
            key={bot.id}
            className={`absolute w-8 h-8 rounded-full ${getStatusColor(bot.status, isUser)} 
            transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => setSelectedBot(bot)}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
              {isUser ? "📍" : "🤖"}
            </div>
          </div>
        );
      })}

      {/* POPUP */}
      {selectedBot && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg w-64">
          <div className="flex justify-between">
            <h2 className="font-bold">{selectedBot.name}</h2>
            <button onClick={() => setSelectedBot(null)}>✖</button>
          </div>
          <p>Status: {selectedBot.status}</p>
          <p>Task: {selectedBot.task}</p>
          <p>
            Location: {selectedBot.lat.toFixed(4)}, {selectedBot.lng.toFixed(4)}
          </p>
        </div>
      )}
    </div>

      </div>
  );
}
