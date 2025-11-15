"use client";

import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="lg:hidden">
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <nav className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
                <span>Home</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">5</span>
                <span className="bg-yellow-500 text-white text-xs rounded-full px-2 py-1">5</span>
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">7</span>
              </div>
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}