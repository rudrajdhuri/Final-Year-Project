'use client';

import { MapPin, Battery, Activity, Clock, Settings, RefreshCw } from 'lucide-react';
import DashboardLayout from '../layout-with-sidebar';
import BotMapFixed from '../components/BotMapFixed';

const bots = [
  {
    id: 'AGR-001',
    name: 'Harvester Bot Alpha',
    status: 'active',
    location: 'Sector A3, Row 15',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    battery: 85,
    task: 'Harvesting Tomatoes',
    lastUpdate: '2 minutes ago',
    speed: '1.2 m/s',
    area: 'Field Zone A'
  },
  {
    id: 'AGR-002',
    name: 'Irrigation Bot Beta',
    status: 'charging',
    location: 'Charging Station B',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    battery: 15,
    task: 'Charging',
    lastUpdate: '45 minutes ago',
    speed: '0 m/s',
    area: 'Service Area'
  },
  {
    id: 'AGR-003',
    name: 'Monitoring Drone Gamma',
    status: 'active',
    location: 'Sector C2, Aerial Survey',
    coordinates: { lat: 40.6782, lng: -73.9442 },
    battery: 72,
    task: 'Crop Health Monitoring',
    lastUpdate: '30 seconds ago',
    speed: '3.5 m/s',
    area: 'Field Zone C'
  },
  {
    id: 'AGR-004',
    name: 'Seeding Bot Delta',
    status: 'maintenance',
    location: 'Maintenance Bay',
    coordinates: { lat: 40.7505, lng: -73.9934 },
    battery: 0,
    task: 'Under Maintenance',
    lastUpdate: '2 hours ago',
    speed: '0 m/s',
    area: 'Service Area'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'charging':
      return 'bg-yellow-100 text-yellow-800';
    case 'maintenance':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getBatteryColor = (battery: number) => {
  if (battery > 60) return 'text-green-600';
  if (battery > 30) return 'text-yellow-600';
  return 'text-red-600';
};

export default function BotLocationPage() {
  return (
    <DashboardLayout>
      <div className="bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <MapPin className="h-8 w-8 text-gray-700" />
                <h1 className="text-3xl font-bold text-gray-900">Bot Location Tracking</h1>
              </div>
              <p className="text-gray-600">Monitor and track all agricultural bots in real-time</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-sm text-gray-600">Active Bots</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Battery className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-sm text-gray-600">Charging</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Settings className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-sm text-gray-600">Maintenance</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">4</p>
                <p className="text-sm text-gray-600">Total Bots</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Live Map View</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Charging</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Maintenance</span>
              </div>
            </div>
          </div>
          
          {/* Interactive Map */}
          <BotMapFixed />
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}