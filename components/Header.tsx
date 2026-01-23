import React from 'react';
import { Phone, MapPin, Activity } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Clinic Name */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-primary-600 text-white shadow-lg">
              <Activity size={28} strokeWidth={2.5} />
            </div>
            <div className="ml-4 flex flex-col justify-center">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                Niramoy Clinic & Diagnostic
              </h1>
              <span className="text-xs font-medium text-primary-600 uppercase tracking-wider mt-1">
                Clinic Management Software
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center text-gray-600 group hover:text-primary-700 transition-colors cursor-default">
              <div className="p-2 bg-gray-50 rounded-full group-hover:bg-primary-50 transition-colors">
                <MapPin size={20} className="text-primary-500" />
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase">Address</span>
                <span className="text-sm font-medium text-gray-800">Enayetpur, Sirajgonj</span>
              </div>
            </div>

            <div className="flex items-center text-gray-600 group hover:text-primary-700 transition-colors cursor-default">
              <div className="p-2 bg-gray-50 rounded-full group-hover:bg-primary-50 transition-colors">
                <Phone size={20} className="text-primary-500" />
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase">Contact</span>
                <span className="text-sm font-medium text-gray-800">01730 923007</span>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu Button Placeholder (if needed later) */}
          <div className="md:hidden">
             {/* Simple mobile indicator */}
             <span className="text-primary-600 font-bold">NCD</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;