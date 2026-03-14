
'use client';

import { MapPin, Battery, Activity, Clock, Settings, RefreshCw } from 'lucide-react';
import BotMapFixed from '../components/BotMapFixed';

const bots = [
  { id: 'AGR-001', name: 'Harvester Bot Alpha',    status: 'active',      battery: 85,  task: 'Harvesting Tomatoes',     lastUpdate: '2 minutes ago',  speed: '1.2 m/s', area: 'Field Zone A' },
  { id: 'AGR-002', name: 'Irrigation Bot Beta',     status: 'charging',    battery: 15,  task: 'Charging',                lastUpdate: '45 minutes ago', speed: '0 m/s',   area: 'Service Area' },
  { id: 'AGR-003', name: 'Monitoring Drone Gamma',  status: 'active',      battery: 72,  task: 'Crop Health Monitoring',  lastUpdate: '30 seconds ago', speed: '3.5 m/s', area: 'Field Zone C' },
  { id: 'AGR-004', name: 'Seeding Bot Delta',       status: 'maintenance', battery: 0,   task: 'Under Maintenance',       lastUpdate: '2 hours ago',    speed: '0 m/s',   area: 'Service Area' },
];

const statusStyle = (status: string) => {
  switch (status) {
    case 'active':      return 'bg-green-100  dark:bg-green-900/30  text-green-800  dark:text-green-300';
    case 'charging':    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    case 'maintenance': return 'bg-red-100    dark:bg-red-900/30    text-red-800    dark:text-red-300';
    default:            return 'bg-gray-100   dark:bg-gray-800      text-gray-800   dark:text-gray-300';
  }
};

const batteryColor = (b: number) => {
  if (b > 60) return 'text-green-600 dark:text-green-400';
  if (b > 30) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const stats = [
  { label: 'Active Bots',  value: 2, icon: Activity, light: 'bg-green-100',  dark: 'dark:bg-green-900/30',  iconColor: 'text-green-600  dark:text-green-400'  },
  { label: 'Charging',     value: 1, icon: Battery,  light: 'bg-yellow-100', dark: 'dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400' },
  { label: 'Maintenance',  value: 1, icon: Settings, light: 'bg-red-100',    dark: 'dark:bg-red-900/30',    iconColor: 'text-red-600    dark:text-red-400'    },
  { label: 'Total Bots',   value: 4, icon: MapPin,   light: 'bg-blue-100',   dark: 'dark:bg-blue-900/30',   iconColor: 'text-blue-600   dark:text-blue-400'   },
];

export default function BotLocationPage() {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <MapPin className="h-7 w-7 text-gray-700 dark:text-gray-300" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Bot Location Tracking</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and track all agricultural bots in real-time</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, icon: Icon, light, dark, iconColor }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${light} ${dark}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 mb-6 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Live Map View</h2>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              {[
                { color: 'bg-green-500',  label: 'Active' },
                { color: 'bg-yellow-500', label: 'Charging' },
                { color: 'bg-red-500',    label: 'Maintenance' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <BotMapFixed />
        </div>

        {/* Bot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {bots.map((bot) => (
            <div key={bot.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 transition-colors duration-200">

              {/* Bot header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono text-gray-400 dark:text-gray-600 mb-0.5">{bot.id}</p>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{bot.name}</h3>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusStyle(bot.status)}`}>
                  {bot.status}
                </span>
              </div>

              {/* Battery */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Battery className="w-3 h-3" /> Battery
                  </span>
                  <span className={`text-xs font-bold ${batteryColor(bot.battery)}`}>{bot.battery}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      bot.battery > 60 ? 'bg-green-500' : bot.battery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${bot.battery}%` }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Activity className="w-3 h-3 shrink-0" />
                  <span className="truncate">{bot.task}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{bot.area}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{bot.lastUpdate}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}