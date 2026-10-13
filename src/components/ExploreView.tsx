import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Utensils,
  Car,
  Sparkles,
  ArrowRight,
  Compass,
  Check,
} from 'lucide-react';
import { CityEvent, LifeMoment, LifeInsight } from '../types/index.ts';

interface ExploreViewProps {
  events: CityEvent[];
  moments: LifeMoment[];
  insights: LifeInsight[];
  onRsvpEvent: (eventId: string, attending: boolean) => Promise<void>;
}

interface DistrictInfo {
  id: string;
  name: string;
  arabicName: string;
  x: number;
  y: number;
  description: string;
  image: string;
  highlight: string;
  category: 'Event' | 'Dining' | 'Business' | 'Artisan' | 'Places';
}

const DISTRICT_EXPLORE: DistrictInfo[] = [
  {
    id: 'marina',
    name: 'Dubai Marina & JBR',
    arabicName: 'مرسى دبي',
    x: 28,
    y: 68,
    description: 'Promenade technology summits, waterfront dining, executive transport staging.',
    image: '/src/assets/images/dubai_marina_event_1791878647556.jpg',
    highlight: 'Dubai Future Evening at Marina Gate Promenade',
    category: 'Event',
  },
  {
    id: 'downtown',
    name: 'Downtown Dubai',
    arabicName: 'وسط مدينة دبي',
    x: 62,
    y: 34,
    description: 'Burj Khalifa boulevard, healthy Mediterranean bowls, and vibrant dining.',
    image: '/src/assets/images/mediterranean_dining_1791878647881.jpg',
    highlight: 'Green Table Downtown Mediterranean Bowl',
    category: 'Dining',
  },
  {
    id: 'difc',
    name: 'DIFC Gate Village',
    arabicName: 'مركز دبي المالي',
    x: 70,
    y: 28,
    description: 'Financial infrastructure, fintech dialogues, and contemporary galleries.',
    image: '/src/assets/images/difc_gate_architecture_1791878648834.jpg',
    highlight: 'DIFC FinTech & Web3 Sunrise on Thursday',
    category: 'Business',
  },
  {
    id: 'alserkal',
    name: 'Alserkal Avenue',
    arabicName: 'السركال أفنيو',
    x: 44,
    y: 48,
    description: 'Creative warehouse quarter, artisan zero food waste sourdough, and design hubs.',
    image: '/src/assets/images/alserkal_artisan_bread_1791878648639.jpg',
    highlight: 'Zaid Artisan Provisions sourdough batch distribution',
    category: 'Artisan',
  },
  {
    id: 'palm',
    name: 'Palm Jumeirah',
    arabicName: 'نخلة جميرا',
    x: 18,
    y: 56,
    description: 'Iconic island coastline, beachside sunset retreats, and quiet relaxation zones.',
    image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80',
    highlight: 'Coastal wellness retreat & sunset quiet hours',
    category: 'Places',
  },
  {
    id: 'businessbay',
    name: 'Business Bay',
    arabicName: 'الخليج التجاري',
    x: 58,
    y: 44,
    description: 'Dubai Canal waterfront, hybrid tech offices, and dynamic executive lounges.',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80',
    highlight: 'Canal walk co-working & evening founder talks',
    category: 'Business',
  },
];

export const ExploreView: React.FC<ExploreViewProps> = ({ events, moments, insights, onRsvpEvent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo>(DISTRICT_EXPLORE[0]);
  const [filterCategory, setFilterCategory] = useState<'All' | 'Events' | 'Dining' | 'Places'>('All');
  const [rsvpd, setRsvpd] = useState<Record<string, boolean>>({});

  const filteredDistricts = DISTRICT_EXPLORE.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.highlight.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterCategory === 'Events') return matchesSearch && d.category === 'Event';
    if (filterCategory === 'Dining') return matchesSearch && d.category === 'Dining';
    if (filterCategory === 'Places') return matchesSearch && (d.category === 'Places' || d.category === 'Business' || d.category === 'Artisan');
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#171D2B] tracking-tight">
            Explore Dubai
          </h1>
          <p className="text-xs text-[#778296] mt-0.5">
            Discover places, gatherings, and dining tailored to your schedule.
          </p>
        </div>

        {/* Floating Search Field */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Marina, Downtown, events..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-[#E9EDF4] text-xs text-[#171D2B] placeholder-[#778296] focus:outline-none focus:border-[#5278F5]/50 shadow-xs"
          />
          <Search className="w-4 h-4 text-[#778296] absolute left-3 top-3" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        {(['All', 'Events', 'Dining', 'Places'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
              filterCategory === cat
                ? 'bg-[#5278F5] text-white shadow-xs'
                : 'bg-white border border-[#E9EDF4] text-[#778296] hover:text-[#171D2B]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Interactive Map + Context Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Large Interactive Map (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E9EDF4] p-6 relative overflow-hidden shadow-xs min-h-[460px] flex flex-col justify-between">
          {/* Subtle Graphic Backdrop */}
          <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" viewBox="0 0 1000 700">
            <path d="M 0,200 Q 250,350 400,500 T 700,680 L 0,700 Z" fill="#DDE8FF" />
            <path d="M 150,680 L 850,150" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6,6" />
            <text x="520" y="380" fill="#94A3B8" fontSize="11" transform="rotate(-33 520,380)">
              Sheikh Zayed Road (E11)
            </text>
          </svg>

          {/* Micro Map Status */}
          <div className="relative z-10 flex items-center justify-between text-xs text-[#778296]">
            <span className="font-medium text-[#171D2B]">Dubai Coastal Strip</span>
            <span>25.2048° N, 55.2708° E</span>
          </div>

          {/* Interactive District Pins */}
          <div className="relative z-10 w-full h-80 my-auto">
            {filteredDistricts.map((d) => {
              const isSelected = selectedDistrict.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDistrict(d)}
                  style={{ left: `${d.x}%`, top: `${d.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 hover:scale-105"
                >
                  <div
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-2xl border transition-all shadow-sm ${
                      isSelected
                        ? 'bg-[#5278F5] text-white border-[#5278F5] font-semibold scale-105'
                        : 'bg-white text-[#171D2B] border-[#E9EDF4] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#5278F5]'}`} />
                    <div className="text-left leading-none">
                      <div className="text-xs">{d.name.split(' ')[0]}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative z-10 text-[11px] text-[#778296] bg-[#F7F9FD] p-2.5 rounded-xl border border-[#E9EDF4] flex items-center justify-between">
            <span>Tap any neighborhood to inspect opportunities</span>
            <span className="font-medium text-[#5278F5]">Selected: {selectedDistrict.name}</span>
          </div>
        </div>

        {/* Selected District Showcase Card (5 Cols, Reference 1 & 2) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-white border border-[#E9EDF4] overflow-hidden shadow-xs space-y-4 p-5">
            {/* Visual Photo Card with 16:9 Aspect Ratio */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden shadow-xs border border-[#E9EDF4]">
              <img
                src={selectedDistrict.image}
                alt={selectedDistrict.name}
                className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-md">
                  {selectedDistrict.category}
                </span>
                <h3 className="text-base font-semibold drop-shadow-sm mt-1">
                  {selectedDistrict.name}
                </h3>
              </div>
            </div>

            {/* Description & Highlight */}
            <div className="space-y-2">
              <p className="text-xs text-[#778296] leading-relaxed">
                {selectedDistrict.description}
              </p>

              <div className="p-3.5 rounded-2xl bg-[#F0F5FF]/70 border border-[#E9EDF4] space-y-1">
                <div className="text-xs font-semibold text-[#5278F5]">Featured Context</div>
                <div className="text-xs text-[#171D2B] font-medium">{selectedDistrict.highlight}</div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-2 border-t border-[#E9EDF4] flex items-center justify-between">
              {selectedDistrict.category === 'Event' ? (
                <button
                  onClick={() => {
                    const evt = events[0];
                    if (evt) {
                      onRsvpEvent(evt.id, true);
                      setRsvpd({ ...rsvpd, [selectedDistrict.id]: true });
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#5278F5] text-white font-medium text-xs hover:bg-[#4166E3] transition flex items-center space-x-1.5 shadow-xs"
                >
                  {rsvpd[selectedDistrict.id] ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>RSVP Confirmed</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm RSVP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-emerald-600 font-medium">Verified Local Partner</span>
              )}

              <span className="text-xs text-[#778296]">{selectedDistrict.arabicName}</span>
            </div>
          </div>

          {/* Transport Shift Insights (For Taxi / Mobility Pros) */}
          <div className="rounded-2xl bg-white border border-[#E9EDF4] p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#171D2B] flex items-center space-x-1.5">
                <Car className="w-3.5 h-3.5 text-[#5278F5]" />
                <span>Transport Egress Curve</span>
              </span>
              <span className="text-[11px] text-[#5278F5] font-medium">Marina Gate</span>
            </div>
            <p className="text-xs text-[#778296]">
              Outflow window: 22:30 to 23:45. ~420 rides projected from actual confirmed attendees. Staging at North Marina loop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
