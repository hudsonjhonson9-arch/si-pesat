import React, { useMemo, useState, useEffect } from 'react';
import { TargetEntity, OpdAudit } from '../types';
import { Map as MapIcon, MapPin, Building, Landmark, Activity, User, BookOpen, BarChart3, CheckCircle, FileText, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface HomeViewProps {
  targetEntities: TargetEntity[];
  audits?: OpdAudit[];
  onSelectAudit?: (audit: OpdAudit) => void;
}

export default function HomeView({ targetEntities, audits = [], onSelectAudit }: HomeViewProps) {
  // Simple analytics computation
  const stats = useMemo(() => {
    const totalAudits = audits.length;
    const completedAudits = audits.filter(a => a.status === 'Selesai').length;
    let totalTemuan = 0;
    
    audits.forEach(audit => {
      audit.categories.forEach(cat => {
        cat.items.forEach(item => {
          if (item.status === 'Temuan') totalTemuan++;
        });
      });
    });

    return { totalAudits, completedAudits, totalTemuan };
  }, [audits]);

  const [loliBoundary, setLoliBoundary] = useState<any>(null);

  useEffect(() => {
    fetch('/loli_boundary.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.type) {
          setLoliBoundary(data);
        }
      })
      .catch(err => console.error('Failed to load boundary geojson:', err));
  }, []);

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
          
          <div className="w-full bg-slate-50 border border-slate-100 overflow-hidden flex-1 relative min-h-[400px] z-10">
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

              {loliBoundary && (
                <GeoJSON 
                  data={loliBoundary} 
                  style={{
                    color: '#f97316', // peach-accent orange/amber
                    weight: 2,
                    opacity: 0.8,
                    fillColor: '#fdba74',
                    fillOpacity: 0.1
                  }} 
                />
              )}

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

        {/* Audit Objects Table */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-dark-gray text-base">Daftar Objek Audit</h3>
              <p className="text-xs text-dark-gray/60 mt-0.5">
                Pemantauan KKA Irban IV.
              </p>
            </div>
            <span className="text-[10px] bg-peach-accent text-dark-gray border border-dark-gray/10 px-2.5 py-1 rounded font-bold font-mono uppercase">
              {audits.length} Objek
            </span>
          </div>

          <div className="overflow-y-auto flex-1 border border-slate-150 rounded-xl bg-white max-h-[450px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-xs">
                <tr className="border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Nama Objek</th>
                  <th className="p-3.5 w-24">Status</th>
                  <th className="p-3.5 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Belum ada KKA.
                    </td>
                  </tr>
                ) : (
                  audits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800">
                        {audit.opdName}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                          audit.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          audit.status === 'Direview' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          audit.status === 'Sedang Berjalan' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onSelectAudit && onSelectAudit(audit)}
                          className="p-1.5 text-slate-400 hover:text-peach-accent hover:bg-peach-accent/10 rounded-md transition-colors"
                          title="Buka KKA"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-dark-gray text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-peach-accent" />
                Analitik KKA
              </h3>
              <p className="text-xs text-dark-gray/60 mt-0.5">
                Progres audit wilayah Loli
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total KKA</p>
                <p className="text-2xl font-black text-slate-800">{stats.totalAudits}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Selesai (Final)</p>
                <p className="text-2xl font-black text-slate-800">{stats.completedAudits}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Temuan</p>
                <p className="text-2xl font-black text-slate-800">{stats.totalTemuan}</p>
              </div>
            </div>
            
            {stats.totalAudits > 0 && (
              <div className="mt-auto bg-peach-accent/10 rounded-xl p-4 border border-peach-accent/20">
                <p className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wider mb-2">Progres Keseluruhan</p>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-peach-accent h-2.5 rounded-full" style={{ width: `${(stats.completedAudits / stats.totalAudits) * 100}%` }}></div>
                </div>
                <p className="text-xs text-right mt-1.5 font-bold text-dark-gray">
                  {Math.round((stats.completedAudits / stats.totalAudits) * 100)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
