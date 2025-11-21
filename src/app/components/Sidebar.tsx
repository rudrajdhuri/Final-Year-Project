'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Code, 
  Palette, 
  Type, 
  Layers, 
  Zap, 
  PieChart, 
  FileText, 
  Star, 
  Bell, 
  Layout,
  FileStack,
  ChevronDown,
  ChevronRight,
  Newspaper,
  MapPin,
  Camera
} from 'lucide-react';

const sidebarItems = [
  { icon: Home, label: 'Dashboard', badge: 'NEW', href: '/' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Newspaper, label: 'Agriculture News', href: '/agriculture-news' },
  { icon: MapPin, label: 'Bot Location', href: '/bot-location' },
  { icon: FileStack, label: 'Soil Sensor Readings', href: '/soil-sensor-readings' },
  { icon: Camera, label: 'Animal Detection', href: '/animal-detection' },
];

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  href?: string;
  expandable?: boolean;
}

function SidebarItem({ icon: Icon, label, badge, href, expandable }: SidebarItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href;

  const handleClick = () => {
    console.log(`Clicked on ${label}`);
    
    if (expandable) {
      setIsExpanded(!isExpanded);
      console.log(`Toggled ${label} expansion: ${!isExpanded}`);
    } else if (href) {
      console.log(`Navigating to ${href}`);
      router.push(href);
    }
  };

  const content = (
    <div
      className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-gray-800 text-white shadow-md' 
          : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-sm'
      } active:scale-95`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        {badge && (
          <span className={`text-xs px-2 py-1 rounded ${
            badge === 'NEW' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {badge}
          </span>
        )}
        {expandable && (
          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        )}
      </div>
    </div>
  );

  if (href && !expandable) {
    return (
      <Link href={href}>
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="text-lg font-semibold">AGRI BOT</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Main Items */}
        <div className="space-y-1">
          {sidebarItems.map((item, index) => (
            <SidebarItem key={index} {...item} />
          ))}
        </div>


      </div>
    </div>
  );
}