'use client';

import { Bell, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'warning',
    title: 'Low Soil Moisture Detected',
    message: 'Sector A3 shows moisture levels below 40%. Consider irrigation.',
    time: '2 minutes ago',
    icon: AlertCircle,
    light: 'text-yellow-600 bg-yellow-100',
    dark:  'dark:text-yellow-400 dark:bg-yellow-900/30',
    dot:   'bg-yellow-500',
  },
  {
    id: 2,
    type: 'success',
    title: 'Irrigation Cycle Completed',
    message: 'Automated irrigation in Sector B2 completed successfully.',
    time: '15 minutes ago',
    icon: CheckCircle,
    light: 'text-green-600 bg-green-100',
    dark:  'dark:text-green-400 dark:bg-green-900/30',
    dot:   'bg-green-500',
  },
  {
    id: 3,
    type: 'info',
    title: 'Weather Update',
    message: 'Rain expected in the next 6 hours. Adjust irrigation schedule accordingly.',
    time: '1 hour ago',
    icon: Info,
    light: 'text-blue-600 bg-blue-100',
    dark:  'dark:text-blue-400 dark:bg-blue-900/30',
    dot:   'bg-blue-500',
  },
  {
    id: 4,
    type: 'warning',
    title: 'Bot Battery Low',
    message: 'Agricultural bot #3 battery at 15%. Return to charging station recommended.',
    time: '2 hours ago',
    icon: AlertCircle,
    light: 'text-orange-600 bg-orange-100',
    dark:  'dark:text-orange-400 dark:bg-orange-900/30',
    dot:   'bg-orange-500',
  },
  {
    id: 5,
    type: 'info',
    title: 'Harvest Schedule',
    message: 'Tomatoes in Sector C1 ready for harvest in 3 days.',
    time: '1 day ago',
    icon: Clock,
    light: 'text-purple-600 bg-purple-100',
    dark:  'dark:text-purple-400 dark:bg-purple-900/30',
    dot:   'bg-purple-500',
  },
];

export default function NotificationsPage() {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Bell className="h-7 w-7 text-gray-700 dark:text-gray-300" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Stay updated with your agricultural operations</p>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Icon badge */}
                  <div className={`p-2 rounded-full shrink-0 ${n.light} ${n.dark}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          {n.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {n.message}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{n.time}</span>
                      </div>
                      {/* Unread dot */}
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.dot}`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load more */}
        <div className="text-center mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm">
            Load More Notifications
          </button>
        </div>

      </div>
    </div>
  );
}