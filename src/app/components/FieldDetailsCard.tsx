import React from 'react';
import { Activity, Droplets, Leaf, Calendar, TrendingUp, MapPin } from 'lucide-react';
import { FieldData } from '../hooks/useFieldData';

interface FieldDetailsCardProps {
  field: FieldData;
  onClose: () => void;
}

export default function FieldDetailsCard({ field, onClose }: FieldDetailsCardProps) {
  const cropEmojis = {
    corn: '🌽',
    wheat: '🌾', 
    soy: '🫘',
    cotton: '🌾',
    other: '🌱'
  };

  const getHealthColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthBg = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-black bg-opacity-95 text-white rounded-xl shadow-2xl p-6 max-w-md border border-green-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          {cropEmojis[field.cropType]} {field.name}
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-300 hover:text-white text-xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* Field Overview */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-300 text-sm">Field Size</span>
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-white font-bold">{field.acres} acres</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-300 text-sm">Crop Type</span>
            <Leaf className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-white font-bold capitalize">{field.cropType}</div>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold mb-3 text-green-400">📊 Field Health</h4>
        
        {/* Soil Health */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-300">Soil Health</span>
            <span className={`font-bold ${getHealthColor(field.soilHealth)}`}>
              {field.soilHealth}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getHealthBg(field.soilHealth)}`}
              style={{ width: `${field.soilHealth}%` }}
            ></div>
          </div>
        </div>

        {/* Moisture Level */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Droplets className="h-4 w-4 text-blue-400 mr-1" />
              <span className="text-sm text-gray-300">Moisture</span>
            </div>
            <span className="font-bold text-blue-400">
              {field.moistureLevel}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${field.moistureLevel}%` }}
            ></div>
          </div>
        </div>

        {/* NDVI */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-sm text-gray-300">NDVI (Plant Health)</span>
            </div>
            <span className="font-bold text-green-400">
              {field.ndviValue.toFixed(3)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
              style={{ width: `${field.ndviValue * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Higher values indicate healthier vegetation
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold mb-3 text-yellow-400">📅 Growing Timeline</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Planted:</span>
            <span className="text-white">{new Date(field.plantingDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Current Stage:</span>
            <span className="text-green-400">{field.currentStage}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Expected Harvest:</span>
            <span className="text-white">{new Date(field.expectedHarvest).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Yield Prediction */}
      <div className="bg-gradient-to-r from-green-800 to-green-600 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-green-200 mr-2" />
            <span className="text-green-200 font-medium">Predicted Yield</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{field.yieldPrediction}</div>
            <div className="text-sm text-green-200">bushels/acre</div>
          </div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="text-xs text-gray-400">
          📍 Field Center: {field.coordinates[0]?.lat.toFixed(6)}, {field.coordinates[0]?.lng.toFixed(6)}
        </div>
      </div>
    </div>
  );
}