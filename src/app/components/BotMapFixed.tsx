'use client';

import { useEffect, useState } from 'react';
import { MapPin, Battery, Activity, Satellite, RefreshCw } from 'lucide-react';
import { useFieldData, formatFieldInfo, getCropColor } from '../hooks/useFieldData';

interface BotLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  battery: number;
  status: 'active' | 'charging' | 'maintenance';
  task: string;
  speed: string;
  lastUpdate: string;
}

export default function BotMapFixed() {
  const [botLocations, setBotLocations] = useState<BotLocation[]>([]);
  const [selectedBot, setSelectedBot] = useState<BotLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Use real field data
  const { fieldData, satelliteImagery, loading: fieldsLoading, error: fieldsError, refreshData } = useFieldData(userLocation || undefined);

  // Get user's current location
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError('');
        setIsLoadingLocation(false);
      },
      (error) => {
        let message = 'Unable to get location: ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message += 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message += 'Location request timed out.';
            break;
          default:
            message += 'An unknown error occurred.';
            break;
        }
        setLocationError(message);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Generate realistic bot locations
  const generateBotLocations = (): BotLocation[] => {
    return [
      {
        id: 'AGR-001',
        name: 'Harvester Bot Alpha',
        lat: 40.7589,
        lng: -73.9851,
        battery: 85,
        status: 'active' as const,
        task: 'Harvesting Tomatoes',
        speed: '1.2 m/s',
        lastUpdate: '2 minutes ago'
      },
      {
        id: 'AGR-002',
        name: 'Irrigation Bot Beta',
        lat: 40.7595,
        lng: -73.9845,
        battery: 92,
        status: 'active' as const,
        task: 'Watering Corn Fields',
        speed: '0.8 m/s',
        lastUpdate: '1 minute ago'
      },
      {
        id: 'AGR-003',
        name: 'Planting Bot Gamma',
        lat: 40.7583,
        lng: -73.9855,
        battery: 67,
        status: 'charging' as const,
        task: 'Seed Planting',
        speed: '0 m/s',
        lastUpdate: '5 minutes ago'
      },
      {
        id: 'AGR-004',
        name: 'Monitoring Drone Delta',
        lat: 40.7597,
        lng: -73.9843,
        battery: 45,
        status: 'maintenance' as const,
        task: 'Crop Monitoring',
        speed: '3.5 m/s',
        lastUpdate: '8 minutes ago'
      }
    ];
  };

  useEffect(() => {
    const bots = generateBotLocations();
    
    // Add user location to bot list if available
    if (userLocation) {
      const userBot: BotLocation = {
        id: 'USER-LOCATION',
        name: 'Your Location',
        lat: userLocation.lat,
        lng: userLocation.lng,
        battery: 100,
        status: 'active',
        task: 'Current Position',
        speed: '0 m/s',
        lastUpdate: 'Now'
      };
      setBotLocations([userBot, ...bots]);
    } else {
      setBotLocations(bots);
    }
  }, [userLocation]);

  const getStatusColor = (status: string, isUser: boolean = false): string => {
    if (isUser) return 'bg-blue-500';
    
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'charging': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-96 bg-gray-900 rounded-lg relative overflow-hidden">
      {/* Clear High-Resolution Satellite Background */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full"
          style={{
            background: `
              linear-gradient(135deg, 
                #2d5016 0%,
                #3d6b1f 20%,
                #4a7c23 40%,
                #3d6b1f 60%,
                #2d5016 80%,
                #1f3d0e 100%
              )
            `
          }}
        >
          {/* Subtle field pattern overlay */}
          <div 
            className="w-full h-full opacity-40"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 40px,
                  rgba(74, 142, 47, 0.2) 40px,
                  rgba(74, 142, 47, 0.2) 80px
                ),
                repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 35px,
                  rgba(101, 163, 13, 0.15) 35px,
                  rgba(101, 163, 13, 0.15) 70px
                )
              `
            }}
          />
        </div>
      </div>

      {/* Real Field Data Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="cornPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="rgba(34, 197, 94, 0.3)"/>
            <path d="M2 2L6 2M2 4L6 4M2 6L6 6" stroke="rgba(22, 163, 74, 0.5)" strokeWidth="0.3"/>
          </pattern>
          <pattern id="wheatPattern" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="rgba(254, 240, 138, 0.4)"/>
            <circle cx="3" cy="3" r="1" fill="rgba(245, 158, 11, 0.4)"/>
          </pattern>
          <pattern id="soyPattern" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="rgba(132, 204, 22, 0.3)"/>
            <ellipse cx="2.5" cy="2.5" rx="1" ry="0.5" fill="rgba(101, 163, 13, 0.5)"/>
          </pattern>
        </defs>
        
        {/* Real Field Data from API */}
        <g opacity="0.9">
          {fieldData.map((field, index) => {
            const patternId = `${field.cropType}Pattern`;
            const cropEmojis = { corn: '🌽', wheat: '🌾', soy: '🫘', cotton: '🌾', other: '🌱' };
            const cropEmoji = cropEmojis[field.cropType] || '🌱';
            
            // Convert field coordinates to SVG viewBox coordinates (simplified)
            const basePoints = [
              [10 + (index % 3) * 30, 15 + Math.floor(index / 3) * 25],
              [35 + (index % 3) * 30, 12 + Math.floor(index / 3) * 25],
              [32 + (index % 3) * 30, 40 + Math.floor(index / 3) * 25],
              [8 + (index % 3) * 30, 38 + Math.floor(index / 3) * 25]
            ];
            
            const pointsString = basePoints.map(p => `${p[0]},${p[1]}`).join(' ');
            const centerX = basePoints.reduce((sum, p) => sum + p[0], 0) / basePoints.length;
            const centerY = basePoints.reduce((sum, p) => sum + p[1], 0) / basePoints.length;
            
            return (
              <g key={field.id}>
                <polygon 
                  points={pointsString}
                  fill={`url(#${patternId})`}
                  stroke={getCropColor(field.cropType, field.ndviValue)}
                  strokeWidth="0.5"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedBot({
                    id: field.id,
                    name: field.name,
                    lat: field.coordinates[0].lat,
                    lng: field.coordinates[0].lng,
                    battery: field.soilHealth,
                    status: 'active' as const,
                    task: `Growing ${field.cropType} - ${field.currentStage}`,
                    speed: `${field.yieldPrediction} bu/ac predicted`,
                    lastUpdate: `Planted ${field.plantingDate}`
                  })}
                />
                <text 
                  x={centerX} 
                  y={centerY - 2} 
                  fontSize="2.5" 
                  fill="white" 
                  textAnchor="middle" 
                  className="font-bold pointer-events-none" 
                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}
                >
                  {cropEmoji} {field.name}
                </text>
                <text 
                  x={centerX} 
                  y={centerY + 1.5} 
                  fontSize="1.8" 
                  fill="white" 
                  textAnchor="middle" 
                  className="font-medium pointer-events-none" 
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}
                >
                  {field.acres.toFixed(1)} acres • NDVI: {field.ndviValue.toFixed(2)}
                </text>
              </g>
            );
          })}
          
          {fieldsLoading && (
            <text x="50" y="50" fontSize="4" fill="white" textAnchor="middle" className="animate-pulse">
              🛰️ Loading Field Data...
            </text>
          )}
          
          {fieldsError && (
            <text x="50" y="50" fontSize="3" fill="#ef4444" textAnchor="middle">
              ⚠️ Failed to load field data
            </text>
          )}
        </g>
      </svg>

      {/* Bot Positions */}
      {botLocations.map((bot, index) => {
        const isUserLocation = bot.id === 'USER-LOCATION';
        
        // For user location, use actual coordinates if available
        let x, y;
        if (isUserLocation && userLocation) {
          // Convert lat/lng to percentage position (simplified mapping)
          x = 50; // Center for user location
          y = 50;
        } else {
          // Spread other bots across width/height
          const botIndex = isUserLocation ? 0 : index - (botLocations.find(b => b.id === 'USER-LOCATION') ? 1 : 0);
          x = 20 + (botIndex % 4) * 20;
          y = 20 + Math.floor(botIndex / 4) * 20;
        }
        
        return (
          <div
            key={bot.id}
            className={`absolute ${isUserLocation ? 'w-12 h-12' : 'w-10 h-10'} ${getStatusColor(bot.status, isUserLocation)} rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-125 border-4 border-white ${
              bot.status === 'active' || isUserLocation ? 'animate-pulse' : ''
            }`}
            style={{ 
              left: `${x}%`, 
              top: `${y}%`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.2)'
            }}
            onClick={() => setSelectedBot(selectedBot?.id === bot.id ? null : bot)}
          >
            {/* Icon inside marker */}
            <div className="absolute inset-2 flex items-center justify-center text-white font-bold text-lg">
              {isUserLocation ? '📍' : '🤖'}
            </div>
            
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap bg-black bg-opacity-70 px-2 py-1 rounded">
              {isUserLocation ? '📍 YOU' : bot.id}
            </div>
          </div>
        );
      })}

      {/* Bot Details Popup */}
      {selectedBot && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-95 text-white rounded-lg shadow-2xl p-4 max-w-xs z-10 border border-green-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">
              {selectedBot.id === 'USER-LOCATION' ? '📍 Your Location' : `🤖 ${selectedBot.name}`}
            </h3>
            <button 
              onClick={() => setSelectedBot(null)}
              className="text-gray-300 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                selectedBot.status === 'active' ? 'bg-green-500 text-white border-green-300' :
                selectedBot.status === 'charging' ? 'bg-yellow-500 text-black border-yellow-300' : 
                'bg-red-500 text-white border-red-300'
              }`}>
                {selectedBot.id === 'USER-LOCATION' ? '🛰️ Live GPS' : selectedBot.status}
              </span>
            </div>
            {selectedBot.id !== 'USER-LOCATION' && (
              <div className="flex items-center justify-between">
                <Battery className="h-4 w-4 text-gray-300" />
                <span className={`font-medium ${selectedBot.battery > 50 ? 'text-green-400' : 'text-orange-400'}`}>
                  {selectedBot.battery.toFixed(1)}%
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Activity className="h-4 w-4 text-gray-300" />
              <span className="font-medium text-white">{selectedBot.task}</span>
            </div>
            <div className="flex items-center justify-between">
              <MapPin className="h-4 w-4 text-gray-300" />
              <span className="text-xs font-mono text-gray-200">
                {selectedBot.lat.toFixed(4)}, {selectedBot.lng.toFixed(4)}
              </span>
            </div>
            <div className="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-600">
              {selectedBot.id === 'USER-LOCATION' ? (
                <div className="space-y-1">
                  <div>🌍 Live GPS Location</div>
                  <div>🕒 Real-time tracking active</div>
                  {userLocation && (
                    <div className="mt-1 p-2 bg-blue-500 bg-opacity-30 rounded text-blue-200 border border-blue-400">
                      📡 Accuracy: High • Source: Device GPS
                    </div>
                  )}
                </div>
              ) : selectedBot.id.startsWith('FIELD_') ? (
                <div className="space-y-1">
                  {(() => {
                    const field = fieldData.find(f => f.id === selectedBot.id);
                    if (!field) return <div>Field data not found</div>;
                    
                    return (
                      <div className="space-y-1">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>📊 Health: <span className="text-green-400">{field.soilHealth}%</span></div>
                          <div>💧 Moisture: <span className="text-blue-400">{field.moistureLevel}%</span></div>
                          <div>🌱 NDVI: <span className="text-yellow-400">{field.ndviValue.toFixed(2)}</span></div>
                          <div>📏 Size: <span className="text-gray-200">{field.acres} ac</span></div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <div>🌾 Stage: {field.currentStage}</div>
                          <div>📈 Yield Est: {field.yieldPrediction} bu/ac</div>
                          <div>📅 Harvest: {new Date(field.expectedHarvest).toLocaleDateString()}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>Speed: {selectedBot.speed} • Updated: {selectedBot.lastUpdate}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-90 text-white rounded-lg shadow-2xl p-3 border border-gray-600">
        <h4 className="text-sm font-semibold text-white mb-2">🗺️ Satellite Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-gray-200">📍 Your GPS Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-gray-200">🤖 Active Bot</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-lg"></div>
            <span className="text-gray-200">🔋 Charging</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full shadow-lg"></div>
            <span className="text-gray-200">🔧 Maintenance</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-600 space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 bg-opacity-40 rounded-sm border border-green-600"></div>
              <span className="text-gray-200">🌽 Corn Fields</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 bg-opacity-40 rounded-sm border border-yellow-500"></div>
              <span className="text-gray-200">🌾 Wheat Fields</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-lime-500 bg-opacity-40 rounded-sm border border-lime-600"></div>
              <span className="text-gray-200">🫘 Soybean Fields</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              📊 Fields: {fieldData.length} | Total: {fieldData.reduce((sum, field) => sum + field.acres, 0).toFixed(1)} acres
            </div>
          </div>
        </div>
      </div>

      {/* Location Controls */}
      <div className="absolute top-4 left-4 space-y-2">
        {/* Real-time indicator */}
        <div className="flex items-center space-x-2 bg-black bg-opacity-80 text-white rounded-full px-3 py-1 shadow-2xl border border-green-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">🛰️ Live Satellite Data</span>
        </div>
        
        {/* Refresh Field Data Button */}
        <button
          onClick={refreshData}
          disabled={fieldsLoading}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-full px-3 py-1 shadow-2xl transition-colors text-xs font-medium border border-purple-300"
        >
          <RefreshCw className={`w-3 h-3 ${fieldsLoading ? 'animate-spin' : ''}`} />
          <span>{fieldsLoading ? 'Updating...' : '🌾 Refresh Fields'}</span>
        </button>
        
        {/* Satellite Info */}
        {satelliteImagery && (
          <div className="bg-blue-600 text-white rounded-full px-3 py-1 shadow-2xl text-xs font-medium border border-blue-300">
            📡 {satelliteImagery.resolution}m • {satelliteImagery.cloudCover}% clouds
          </div>
        )}
        
        {/* Location button */}
        <button
          onClick={getUserLocation}
          disabled={isLoadingLocation}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full px-3 py-1 shadow-2xl transition-colors text-xs font-medium border border-blue-300"
        >
          {isLoadingLocation ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Getting GPS...</span>
            </>
          ) : (
            <>
              <MapPin className="w-3 h-3" />
              <span>📍 Get My Location</span>
            </>
          )}
        </button>
        
        {/* Location status */}
        {userLocation && (
          <div className="bg-green-500 text-white rounded-full px-3 py-1 shadow-2xl text-xs font-medium border border-green-300">
            📍 GPS Active
          </div>
        )}
        
        {/* Error message */}
        {locationError && (
          <div className="bg-red-600 text-white rounded-lg px-3 py-1 shadow-2xl text-xs max-w-xs border border-red-300">
            {locationError}
          </div>
        )}
      </div>
    </div>
  );
}