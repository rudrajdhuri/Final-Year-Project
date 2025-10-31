'use client';

import { Bell, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
import DashboardLayout from '../layout-with-sidebar';

const notifications = [
  {
    id: 1,
    type: 'warning',
    title: 'Low Soil Moisture Detected',
    message: 'Sector A3 shows moisture levels below 40%. Consider irrigation.',
    time: '2 minutes ago',
    icon: AlertCircle,
    color: 'text-yellow-600 bg-yellow-100'
  },
  {
    id: 2,
    type: 'success',
    title: 'Irrigation Cycle Completed',
    message: 'Automated irrigation in Sector B2 completed successfully.',
    time: '15 minutes ago',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100'
  },
  {
    id: 3,
    type: 'info',
    title: 'Weather Update',
    message: 'Rain expected in the next 6 hours. Adjust irrigation schedule accordingly.',
    time: '1 hour ago',
    icon: Info,
    color: 'text-blue-600 bg-blue-100'
  },
  {
    id: 4,
    type: 'warning',
    title: 'Bot Battery Low',
    message: 'Agricultural bot #3 battery at 15%. Return to charging station recommended.',
    time: '2 hours ago',
    icon: AlertCircle,
    color: 'text-orange-600 bg-orange-100'
  },
  {
    id: 5,
    type: 'info',
    title: 'Harvest Schedule',
    message: 'Tomatoes in Sector C1 ready for harvest in 3 days.',
    time: '1 day ago',
    icon: Clock,
    color: 'text-purple-600 bg-purple-100'
  }
];

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Bell className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          </div>
          <p className="text-gray-600">Stay updated with your agricultural operations</p>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => {
            const IconComponent = notification.icon;
            return (
              <div
                key={notification.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${notification.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <span className="text-sm text-gray-500">
                          {notification.time}
                        </span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Load More Notifications
          </button>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}