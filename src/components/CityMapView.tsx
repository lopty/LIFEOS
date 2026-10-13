import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Car,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { CityEvent, LifeMoment, LifeInsight } from '../types/index.ts';

interface CityMapViewProps {
  events: CityEvent[];
  moments: LifeMoment[];
  insights: LifeInsight[];
  onSelectEvent?: (event: CityEvent) => void;
}

interface District {
  id: string;
  name: string;
  arabicName: string;
  x: number;
  y: number;
  description: string;
  activityCount: number;
  highlight: string;
}

const DUBAI_DISTRICTS: District[] = [
  {
    id: 'marina',
    name: 'Dubai Marina and JBR',
    arabicName: 'مرسى دبي',
    x: 28,
    y: 68,
    description: 'High-density waterfront promenade, technology gatherings, executive transport corridor.',
    activityCount: 42,
    highlight: 'Dubai Future Evening staging active at Marina Gate',
  },
  {
    id: 'palm',
    name: 'Palm Jumeirah',
    arabicName: 'نخلة جميرا',
    x: 18,
    y: 54,
    description: 'Coastal residences, hotels, and calm seaside retreats.',
    activityCount: 16,
    highlight: 'Quiet evening zone and leisure dining',
  },
  {
    id: 'downtown',
    name: 'Downtown Dubai',
    arabicName: 'وسط مدينة دبي',
    x: 62,
    y: 34,
    description: 'Burj Khalifa, Dubai Mall, corporate headquarters, and dining hubs.',
    activityCount: 58,
    highlight: 'Clean Mediterranean dining matches and table holds',
  },
  {
    id: 'difc',
    name: 'DIFC',
    arabicName: 'مركز دبي المالي',
    x: 70,
    y: 28,
    description: 'Gate Village, financial infrastructure, venture capital dialogues.',
    activityCount: 34,
    highlight: 'DIFC FinTech and Web3 Sunrise event on Thursday',
  },
  {
    id: 'businessbay',
    name: 'Business Bay',
    arabicName: 'الخليج التجاري',
    x: 58,
    y: 44,
    description: 'Dubai Canal promenade, consulting firms, hybrid remote residences.',
    activityCount: 29,
    highlight: 'Flexible work schedules and quiet hours',
  },
  {
    id: 'alserkal',
    name: 'Alserkal Avenue',
    arabicName: 'السركال أفنيو',
    x: 44,
    y: 48,
    description: 'Warehouse arts district, artisan food rescue, sustainability salons.',
    activityCount: 22,
    highlight: 'Zaid Artisan Provisions sourdough batch distribution',
  },
];

export const CityMapView: React.FC<CityMapViewProps> = ({ events, moments, insights }) => {
  const [selectedDistrict, setSelectedDistrict] = useState<District>(DUBAI_DISTRICTS[0]);
  const [layer, setLayer] = useState<'ALL' | 'EVENTS' | 'TRANSPORT' | 'MOMENTS'>('ALL');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-slate-900">Dubai City Map</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualizing opted-in moments, event corridors, and verified services.
          </p>
        </div>

        {/* Clean Layer Toggles */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setLayer('ALL')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              layer === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Layers
          </button>
          <button
            onClick={() => setLayer('EVENTS')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              layer === 'EVENTS' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setLayer('TRANSPORT')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              layer === 'TRANSPORT' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transport
          </button>
          <button
            onClick={() => setLayer('MOMENTS')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              layer === 'MOMENTS' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Moments
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clean Map Graphic (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-50 border border-slate-200 p-6 relative overflow-hidden shadow-sm min-h-[500px] flex flex-col justify-between">
          <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 1000 700">
            {/* Arabian Gulf Water Curve */}
            <path d="M 0,200 Q 250,350 400,500 T 700,680 L 0,700 Z" fill="#e0f2fe" />
            {/* Sheikh Zayed Road Spine */}
            <path d="M 150,680 L 850,150" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />
            <text x="520" y="380" fill="#64748b" fontSize="12" transform="rotate(-33 520,380)">
              Sheikh Zayed Road (E11)
            </text>
          </svg>

          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-700">Dubai Metropolitan Zone</span>
            <span>25.2048° N, 55.2708° E</span>
          </div>

          {/* Interactive District Pins */}
          <div className="relative z-10 w-full h-96 my-auto">
            {DUBAI_DISTRICTS.map((d) => {
              const isSelected = selectedDistrict.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDistrict(d)}
                  style={{ left: `${d.x}%`, top: `${d.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition transform hover:scale-105"
                >
                  <div
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition shadow-sm ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <div className="text-left">
                      <div className="text-xs leading-none">{d.name}</div>
                      <div className="text-[9px] opacity-70 mt-0.5">{d.arabicName}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Legend */}
          <div className="relative z-10 flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              <span>Technology & Events</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Transport Corridors</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Verified Food Partners</span>
            </div>
          </div>
        </div>

        {/* Right Col: Details */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Selected District</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedDistrict.name}</h3>
                <p className="text-xs text-slate-400">{selectedDistrict.arabicName}</p>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700">
                {selectedDistrict.activityCount} moments
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedDistrict.description}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
              <strong className="text-slate-900 block font-semibold">Active Highlight:</strong>
              <p>{selectedDistrict.highlight}</p>
            </div>
          </div>

          {/* Transport Outflow */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4 text-slate-700" />
                <h4 className="text-sm font-semibold text-slate-900">Transport Egress Projection</h4>
              </div>
              <span className="text-xs text-emerald-800 font-medium">
                Verified
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Marina Gate Terrace: 420 estimated rides between 22:30 and 23:45.
            </p>

            <div className="space-y-2 text-xs pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-700 text-xs">
                  <span>Downtown and DIFC Corridor</span>
                  <span className="font-semibold">44%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-slate-900 h-full rounded-full" style={{ width: '44%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-700 text-xs">
                  <span>Palm Jumeirah and JBR Local</span>
                  <span className="font-semibold">32%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '32%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-700 text-xs">
                  <span>Airport Express (DXB)</span>
                  <span className="font-semibold">24%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              Staging designated at North Marina Valet Loop. No cruising required.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
