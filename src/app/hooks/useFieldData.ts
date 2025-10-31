import { useState, useEffect } from 'react';

export interface FieldData {
  id: string;
  name: string;
  cropType: 'corn' | 'wheat' | 'soy' | 'cotton' | 'other';
  acres: number;
  coordinates: Array<{ lat: number; lng: number }>;
  soilHealth: number; // 0-100
  moistureLevel: number; // 0-100
  ndviValue: number; // 0-1 (Normalized Difference Vegetation Index)
  plantingDate: string;
  expectedHarvest: string;
  currentStage: string;
  yieldPrediction: number; // bushels per acre
}

export interface SatelliteImagery {
  url: string;
  date: string;
  cloudCover: number;
  resolution: number; // meters per pixel
}

// Hook for fetching real agricultural data
export function useFieldData(location?: { lat: number; lng: number }) {
  const [fieldData, setFieldData] = useState<FieldData[]>([]);
  const [satelliteImagery, setSatelliteImagery] = useState<SatelliteImagery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFieldData = async () => {
    if (!location) return;
    
    try {
      setLoading(true);
      
      // Replace with real API calls
      // Example: USDA NASS API, Sentinel Hub, Planet Labs, etc.
      
      // Simulated real data structure for demonstration
      const mockFieldData: FieldData[] = [
        {
          id: 'FIELD_001',
          name: 'North Quarter Section',
          cropType: 'corn',
          acres: 120.5,
          coordinates: [
            { lat: location.lat + 0.002, lng: location.lng - 0.003 },
            { lat: location.lat + 0.002, lng: location.lng + 0.001 },
            { lat: location.lat - 0.001, lng: location.lng + 0.001 },
            { lat: location.lat - 0.001, lng: location.lng - 0.003 }
          ],
          soilHealth: 78,
          moistureLevel: 65,
          ndviValue: 0.72,
          plantingDate: '2025-04-15',
          expectedHarvest: '2025-10-20',
          currentStage: 'Grain Filling (R4)',
          yieldPrediction: 185
        },
        {
          id: 'FIELD_002', 
          name: 'South East Field',
          cropType: 'soy',
          acres: 85.2,
          coordinates: [
            { lat: location.lat - 0.001, lng: location.lng + 0.002 },
            { lat: location.lat - 0.001, lng: location.lng + 0.004 },
            { lat: location.lat - 0.003, lng: location.lng + 0.004 },
            { lat: location.lat - 0.003, lng: location.lng + 0.002 }
          ],
          soilHealth: 82,
          moistureLevel: 58,
          ndviValue: 0.68,
          plantingDate: '2025-05-10',
          expectedHarvest: '2025-09-25',
          currentStage: 'Pod Development (R3)',
          yieldPrediction: 52
        },
        {
          id: 'FIELD_003',
          name: 'West Quarter',
          cropType: 'wheat',
          acres: 95.8,
          coordinates: [
            { lat: location.lat + 0.001, lng: location.lng - 0.005 },
            { lat: location.lat + 0.001, lng: location.lng - 0.002 },
            { lat: location.lat - 0.002, lng: location.lng - 0.002 },
            { lat: location.lat - 0.002, lng: location.lng - 0.005 }
          ],
          soilHealth: 75,
          moistureLevel: 72,
          ndviValue: 0.64,
          plantingDate: '2024-09-20',
          expectedHarvest: '2025-07-15',
          currentStage: 'Harvest Ready',
          yieldPrediction: 68
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFieldData(mockFieldData);
      
      // Mock satellite imagery data
      setSatelliteImagery({
        url: `https://api.sentinel-hub.com/ogc/wms/YOUR-INSTANCE-ID?service=WMS&request=GetMap&layers=TRUE_COLOR&styles=&format=image%2Fjpeg&transparent=false&version=1.1.1&width=512&height=512&srs=EPSG%3A4326&bbox=${location.lng-0.01},${location.lat-0.01},${location.lng+0.01},${location.lat+0.01}`,
        date: new Date().toISOString().split('T')[0],
        cloudCover: 15,
        resolution: 10
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch field data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldData();
  }, [location]);

  // Function to refresh data
  const refreshData = () => {
    if (location) {
      setError(null);
      fetchFieldData();
    }
  };

  return {
    fieldData,
    satelliteImagery,
    loading,
    error,
    refreshData
  };
}

// Function to get crop color based on type and health
export function getCropColor(cropType: string, ndviValue: number): string {
  const baseColors = {
    corn: '#22c55e',
    soy: '#84cc16', 
    wheat: '#f59e0b',
    cotton: '#f8fafc',
    other: '#6b7280'
  };
  
  const intensity = Math.max(0.3, ndviValue); // Ensure minimum visibility
  const color = baseColors[cropType as keyof typeof baseColors] || baseColors.other;
  
  return `${color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`;
}

// Function to format field data for display
export function formatFieldInfo(field: FieldData): string[] {
  return [
    `📊 Health: ${field.soilHealth}%`,
    `💧 Moisture: ${field.moistureLevel}%`,
    `🌱 NDVI: ${field.ndviValue.toFixed(2)}`,
    `📏 Size: ${field.acres} acres`,
    `🌾 Stage: ${field.currentStage}`,
    `📈 Est. Yield: ${field.yieldPrediction} bu/ac`
  ];
}