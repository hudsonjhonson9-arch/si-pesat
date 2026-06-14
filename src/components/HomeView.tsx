import React from 'react';
import { TargetEntity } from '../types';
import { Map as MapIcon, MapPin, Building, Landmark, Activity, User, BookOpen } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface HomeViewProps {
  targetEntities: TargetEntity[];
}

export default function HomeView({ targetEntities }: HomeViewProps) {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'OPD': return <Building className="w-4 h-4" />;
      case 'Desa': return <Landmark className="w-4 h-4" />;
      case 'Sekolah': return <BookOpen className="w-4 h-4" />;
      case 'Puskesmas': return <Activity className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'OPD': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Desa': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Sekolah': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Puskesmas': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const createCustomIcon = (type: string) => {
    let colorClass = 'bg-slate-500 text-white';
    switch (type) {
      case 'OPD': colorClass = 'bg-blue-600 text-white'; break;
      case 'Desa': colorClass = 'bg-emerald-600 text-white'; break;
      case 'Sekolah': colorClass = 'bg-amber-500 text-white'; break;
      case 'Puskesmas': colorClass = 'bg-rose-600 text-white'; break;
    }

    return L.divIcon({
      className: 'bg-transparent border-0',
      html: `<div class="w-7 h-7 rounded-full ${colorClass} border-2 border-white shadow-md flex items-center justify-center font-bold text-[10px] uppercase">${type.charAt(0)}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="home-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-10 w-40 h-40 bg-peach-accent/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <span className="bg-white/20 backdrop-blur-md border border-white/10 text-[10px] px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 uppercase tracking-wider mb-3">
            <Building className="w-3.5 h-3.5" /> Inspektorat Daerah
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
            Inspektur Pembantu Wilayah IV
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Mempunyai tugas pokok melaksanakan pengawasan internal terhadap kinerja dan keuangan 
            pada OPD, Kecamatan, Desa, Sekolah, dan Puskesmas di wilayah kerja Irban 4.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-dark-gray text-lg flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-peach-accent" />
                Peta Wilayah Pengawasan
              </h3>
              <p className="text-xs text-dark-gray/60 mt-0.5">
                Cakupan wilayah Kecamatan Loli, Kabupaten Sumba Barat
              </p>
            </div>
          </div>
          
          <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex-1 relative min-h-[400px] z-10">
            <MapContainer 
              center={[-9.6385, 119.3972]} 
              zoom={12} 
              scrollWheelZoom={true} 
              className="absolute inset-0 w-full h-full"
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Peta Jalan (OSM)">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Peta Satelit (Esri)">
                  <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              {targetEntities.map(entity => (
                entity.latitude && entity.longitude ? (
                  <Marker 
                    key={entity.id} 
                    position={[entity.latitude, entity.longitude]}
                    icon={createCustomIcon(entity.type)}
                  >
                    <Popup>
                      <div className="text-center p-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1.5 ${getBadgeColor(entity.type)}`}>
                          {entity.type}
                        </span>
                        <h4 className="font-bold text-xs text-slate-800 m-0">{entity.name}</h4>
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Target Entities Table */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-dark-gray text-base">Daftar Entitas</h3>
              <p className="text-xs text-dark-gray/60 mt-0.5">
                Wilayah pengawasan Irban IV.
              </p>
            </div>
            <span className="text-[10px] bg-peach-accent text-dark-gray border border-dark-gray/10 px-2.5 py-1 rounded font-bold font-mono uppercase">
              {targetEntities.length} Entitas
            </span>
          </div>

          <div className="overflow-y-auto flex-1 border border-slate-150 rounded-xl bg-white max-h-[450px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-xs">
                <tr className="border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Nama Entitas</th>
                  <th className="p-3.5 w-24">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {targetEntities.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-400">
                      <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Belum ada data entitas.
                    </td>
                  </tr>
                ) : (
                  targetEntities.map((entity, idx) => (
                    <tr key={entity.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800">
                        {entity.name}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getBadgeColor(entity.type)}`}>
                          {getIconForType(entity.type)} {entity.type}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
