import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProperty {
  id: string;
  name: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  photos: string[] | null;
  rating: number | null;
  vacantBeds: number;
  rentRange: string;
}

interface PropertyMapProps {
  properties: MapProperty[];
  onPropertyClick: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const getMarkerColor = (vacantBeds: number) => {
  if (vacantBeds === 0) return '#ef4444';
  if (vacantBeds <= 3) return '#f59e0b';
  return '#22c55e';
};

const createMarkerIcon = (vacantBeds: number, rent: string) => {
  const color = getMarkerColor(vacantBeds);
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      background:${color};color:#fff;font-size:11px;font-weight:600;
      padding:4px 8px;border-radius:8px;white-space:nowrap;
      box-shadow:0 2px 8px ${color}44;border:2px solid #fff;
      font-family:Inter,sans-serif;letter-spacing:-0.01em;
    ">${rent}</div>
    <div style="width:0;height:0;margin:auto;
      border-left:6px solid transparent;border-right:6px solid transparent;
      border-top:6px solid ${color};
    "></div>`,
    iconSize: [80, 36],
    iconAnchor: [40, 36],
    popupAnchor: [0, -36],
  });
};

export default function PropertyMap({ properties, onPropertyClick, center, zoom = 12, className = '' }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const defaultCenter: [number, number] = center || [12.9716, 77.5946]; // Bangalore
    mapInstance.current = L.map(mapRef.current, {
      center: defaultCenter,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    markersRef.current = L.layerGroup().addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;
    markersRef.current.clearLayers();

    const validProps = properties.filter(p => p.latitude && p.longitude);
    if (validProps.length === 0) return;

    validProps.forEach(p => {
      const icon = createMarkerIcon(p.vacantBeds, p.rentRange);
      const marker = L.marker([p.latitude!, p.longitude!], { icon });

      const popupContent = `
        <div style="font-family:Inter,sans-serif;min-width:200px;padding:4px;">
          ${p.photos?.[0] ? `<img src="${p.photos[0]}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ''}
          <div style="font-weight:600;font-size:13px;margin-bottom:2px;">${p.name}</div>
          <div style="font-size:11px;color:#666;margin-bottom:6px;">${p.area || ''}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:600;font-size:14px;">${p.rentRange}</span>
            <span style="font-size:11px;color:${getMarkerColor(p.vacantBeds)};">${p.vacantBeds} beds free</span>
          </div>
          <div style="margin-top:8px;text-align:center;">
            <span style="font-size:11px;color:#f97316;cursor:pointer;font-weight:500;">View Details →</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: false, maxWidth: 260 });
      marker.on('popupopen', () => {
        const el = marker.getPopup()?.getElement();
        el?.addEventListener('click', () => onPropertyClick(p.id));
      });

      markersRef.current!.addLayer(marker);
    });

    // Fit bounds
    const bounds = L.latLngBounds(validProps.map(p => [p.latitude!, p.longitude!]));
    mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [properties, onPropertyClick]);

  return <div ref={mapRef} className={`w-full h-full ${className}`} style={{ minHeight: 400 }} />;
}
