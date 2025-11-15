"use client";

import React, { useEffect, useState } from 'react';

interface Readings {
  moisture: number; // %
  temperature: number; // °C
  ph: number; // pH
}

export default function SoilCard({ initial }: { initial?: Readings }) {
  const [readings, setReadings] = useState<Readings>(initial || { moisture: 32.5, temperature: 24.3, ph: 6.8 });

  // Simulate live updates every 5s (replace with real API later)
  useEffect(() => {
    const id = setInterval(() => {
      setReadings(prev => ({
        moisture: Math.min(100, Math.max(0, +(prev.moisture + (Math.random() - 0.5) * 2).toFixed(1))),
        temperature: +(prev.temperature + (Math.random() - 0.5) * 0.6).toFixed(1),
        ph: +(prev.ph + (Math.random() - 0.5) * 0.05).toFixed(2)
      }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-gray-900 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Soil Sensor Readings</h3>
        <span className="text-xs text-gray-500">Live • <span className="font-mono">●</span></span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded text-center">
          <div className="text-xs text-gray-500">Moisture</div>
          <div className="text-2xl font-bold text-green-600">{readings.moisture}%</div>
        </div>

        <div className="bg-gray-50 p-4 rounded text-center">
          <div className="text-xs text-gray-500">Temp</div>
          <div className="text-2xl font-bold text-orange-600">{readings.temperature}°C</div>
        </div>

        <div className="bg-gray-50 p-4 rounded text-center">
          <div className="text-xs text-gray-500">pH</div>
          <div className="text-2xl font-bold text-yellow-600">{readings.ph}</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Sensor: <span className="text-gray-900 font-medium">SoilNode-01</span>
      </div>
    </div>
  );
}
