'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { NearbyCar, MapClickPoint } from '@/types';
import { api } from '@/lib/api';
import { calculateDistance } from '@/lib/utils';
import { Navigation, Locate, MapPin } from 'lucide-react';

interface MapViewProps {
    userLocation: { lat: number; lng: number } | null;
    pickupLocation?: { lat: number; lng: number } | null;
    dropoffLocation?: { lat: number; lng: number } | null;
    nearbyCars: NearbyCar[];
    selectedCarId: string | null;
    routeCoordinates: [number, number][] | null;
    onMapClick?: (point: MapClickPoint) => void;
    mode?: 'idle' | 'selectingPickup' | 'selectingDropoff';
}

export default function MapView({
    userLocation,
    pickupLocation,
    dropoffLocation,
    nearbyCars,
    selectedCarId,
    routeCoordinates,
    onMapClick,
    mode = 'idle',
}: MapViewProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
    const userMarker = useRef<maplibregl.Marker | null>(null);
    const pickupMarker = useRef<maplibregl.Marker | null>(null);
    const dropoffMarker = useRef<maplibregl.Marker | null>(null);
    const routeLayerId = 'route-layer';
    const routeSourceId = 'route-source';

    // Initialize map
    useEffect(() => {
        console.log('MapView: useEffect triggered');
        if (map.current) {
            console.log('MapView: Map already initialized');
            return;
        }

        if (!mapContainer.current) {
            console.error('MapView: mapContainer ref is null');
            return;
        }

        console.log('MapView: Initializing map...');
        try {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: {
                    version: 8,
                    sources: {
                        osm: {
                            type: 'raster',
                            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                            tileSize: 256,
                            attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                        },
                    },
                    layers: [
                        {
                            id: 'osm',
                            type: 'raster',
                            source: 'osm',
                            minzoom: 0,
                            maxzoom: 19,
                        },
                    ],
                },
                center: [-7.62, 33.55], // Default to Casablanca
                zoom: 12,
            });

            map.current.on('load', () => {
                console.log('MapView: Map loaded successfully');
                // Add route source and layer
                map.current?.addSource(routeSourceId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: [],
                        },
                    },
                });

                map.current?.addLayer({
                    id: routeLayerId,
                    type: 'line',
                    source: routeSourceId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': '#3B82F6',
                        'line-width': 4,
                        'line-opacity': 0.8,
                    },
                });
            });

            map.current.on('click', (e) => {
                console.log('Map clicked at:', e.lngLat);
                if (onMapClick) {
                    console.log('Calling onMapClick with:', { lng: e.lngLat.lng, lat: e.lngLat.lat });
                    onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
                } else {
                    console.log('onMapClick handler is not defined');
                }
            });

            map.current.on('error', (e) => {
                console.error('MapView: Map error:', e);
            });

        } catch (err) {
            console.error('MapView: Error initializing map:', err);
        }
    }, []);

    // Update cursor style based on mode
    useEffect(() => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = mode !== 'idle' ? 'crosshair' : 'grab';
    }, [mode]);

    // Update user marker (GPS)
    useEffect(() => {
        if (!map.current || !userLocation) return;

        if (!userMarker.current) {
            const el = document.createElement('div');
            el.className = 'user-marker';
            el.innerHTML = `
                <div class="relative flex h-6 w-6">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-6 w-6 bg-blue-500 border-2 border-white shadow-lg"></span>
                </div>
            `;
            userMarker.current = new maplibregl.Marker({ element: el })
                .setLngLat([userLocation.lng, userLocation.lat])
                .addTo(map.current);

            // Only fly to user if no pickup is set (initial state)
            if (!pickupLocation) {
                map.current.flyTo({
                    center: [userLocation.lng, userLocation.lat],
                    zoom: 14,
                    essential: true
                });
            }
        } else {
            userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
        }
    }, [userLocation]);

    // Update Pickup Marker
    useEffect(() => {
        if (!map.current) return;

        if (pickupLocation) {
            if (!pickupMarker.current) {
                const el = document.createElement('div');
                el.style.width = '24px';
                el.style.height = '24px';
                el.style.backgroundColor = '#22c55e'; // green-500
                el.style.borderRadius = '50%';
                el.style.border = '2px solid white';
                el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.color = 'white';
                el.style.fontSize = '10px';
                el.style.fontWeight = 'bold';
                el.textContent = 'P';

                pickupMarker.current = new maplibregl.Marker({ element: el })
                    .setLngLat([pickupLocation.lng, pickupLocation.lat])
                    .addTo(map.current);
            } else {
                pickupMarker.current.setLngLat([pickupLocation.lng, pickupLocation.lat]);
            }
        } else if (pickupMarker.current) {
            pickupMarker.current.remove();
            pickupMarker.current = null;
        }
    }, [pickupLocation]);

    // Update Dropoff Marker
    useEffect(() => {
        console.log('Dropoff useEffect triggered, dropoffLocation:', dropoffLocation);
        if (!map.current) {
            console.log('Map not initialized yet');
            return;
        }

        if (dropoffLocation) {
            console.log('Creating/updating dropoff marker at:', dropoffLocation);
            if (!dropoffMarker.current) {
                const el = document.createElement('div');
                el.style.width = '24px';
                el.style.height = '24px';
                el.style.backgroundColor = '#ef4444'; // red-500
                el.style.borderRadius = '50%';
                el.style.border = '2px solid white';
                el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.color = 'white';
                el.style.fontSize = '10px';
                el.style.fontWeight = 'bold';
                el.textContent = 'D';

                dropoffMarker.current = new maplibregl.Marker({ element: el })
                    .setLngLat([dropoffLocation.lng, dropoffLocation.lat])
                    .addTo(map.current);
                console.log('Dropoff marker created successfully');
            } else {
                dropoffMarker.current.setLngLat([dropoffLocation.lng, dropoffLocation.lat]);
                console.log('Dropoff marker position updated');
            }
        } else if (dropoffMarker.current) {
            dropoffMarker.current.remove();
            dropoffMarker.current = null;
            console.log('Dropoff marker removed');
        }
    }, [dropoffLocation]);

    // Update car markers
    useEffect(() => {
        if (!map.current) return;

        // Remove markers for cars that are no longer nearby
        const currentCarIds = new Set(nearbyCars.map(c => c.car_id));
        markers.current.forEach((marker, id) => {
            if (!currentCarIds.has(id)) {
                marker.remove();
                markers.current.delete(id);
            }
        });

        // Add or update markers
        nearbyCars.forEach(car => {
            const isSelected = car.car_id === selectedCarId;

            if (markers.current.has(car.car_id)) {
                const marker = markers.current.get(car.car_id)!;
                marker.setLngLat([car.lng, car.lat]);

                // Update rotation and style of the INNER element
                const el = marker.getElement();
                const inner = el.querySelector('.car-inner') as HTMLElement;
                if (inner) {
                    inner.style.transform = `rotate(${car.heading}deg) ${isSelected ? 'scale(1.2)' : 'scale(1)'}`;
                    el.style.zIndex = isSelected ? '10' : '1';

                    // Update SVG fill colors based on selection
                    const path = inner.querySelector('path');
                    if (path) {
                        path.setAttribute('fill', isSelected ? '#2563EB' : '#000000');
                    }
                }

            } else {
                const el = document.createElement('div');
                el.className = 'car-marker';
                // Remove fixed size from container to let inner handle it, or keep it for hit area
                el.style.width = '24px';
                el.style.height = '24px';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';

                // Create inner container for rotation
                const inner = document.createElement('div');
                inner.className = 'car-inner';
                inner.style.width = '100%';
                inner.style.height = '100%';
                inner.style.transition = 'transform 0.3s ease-out';
                inner.style.transform = `rotate(${car.heading}deg)`;

                // Custom SVG Car Icon
                inner.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g transform="rotate(90 16 16)">
                            <path fill="${isSelected ? '#2563EB' : '#000000'}" fill-rule="evenodd" d="M12.84 7.022c-.802-.173-1.7.689-1.84 1.978H4.5c-1 0-2.112.896-2.377 1.344-.456.509-.695.875-1.009 2.112-.159.128-.345.384-.424.576C.318 13.928 0 14.9 0 16.5s.318 2.572.69 3.468c.08.192.265.448.424.576.314 1.237.553 1.603 1.009 2.112C2.388 23.104 3.5 24 4.5 24H11c.14 1.29 1.038 2.15 1.84 1.978.147-.032.193-.2.137-.333-.2-.472-.368-1.27-.422-1.645h14.191c2.017 0 4.504-1.25 4.754-2.25.348-1.39.5-2.75.5-5.25s-.152-3.86-.5-5.25c-.25-1-2.737-2.25-4.754-2.25H12.555c.054-.374.223-1.173.422-1.645.056-.133.01-.301-.137-.333zM3 10.5c.682-.5 1.5-.5 2-.5-1.183.756-2.182 1.667-3 3 0-1 .523-1.917 1-2.5zm23.5-.5H19c.043.055.086.107.127.157.197.237.364.438.373.843 2.625 0 4.25 0 6.5-.25l.114-.15h.001a2.81 2.81 0 0 0 .385-.6zm-14 0h6c.25.25.512.617.498 1C14 11 13 10.5 12.5 10zM3 22.5c.682.5 1.5.5 2 .5-1.183-.756-2.182-1.667-3-3 0 1 .523 1.917 1 2.5zm16 .5h7.5a2.81 2.81 0 0 0-.385-.6L26 22.25C23.75 22 22.125 22 19.5 22c-.009.405-.176.607-.373.843-.041.05-.084.102-.127.157zM9 16.5c0-2.5.334-3.784.862-5.191a.483.483 0 0 1 .529-.303l3.691.575a.493.493 0 0 1 .414.551c-.072.532-.146.96-.215 1.354-.155.897-.281 1.764-.281 3.014s.126 2.116.281 3.014c.069.394.143.822.215 1.354a.493.493 0 0 1-.414.552l-3.691.574a.483.483 0 0 1-.529-.303C9.334 20.284 9 19 9 16.5zM26.396 12a.525.525 0 0 0-.527.612c.233 2.781.224 5.265 0 7.776-.05.323.2.624.527.612l2.995-.11a.98.98 0 0 0 .887-.63c.945-2.53.945-5.034 0-7.52a.98.98 0 0 0-.887-.63zM18.5 23h-6c.5-.5 1.5-1 6.498-1 .014.383-.248.75-.498 1z" clip-rule="evenodd" opacity="1"></path>
                        </g>
                    </svg>
                `;

                el.appendChild(inner);

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([car.lng, car.lat])
                    .addTo(map.current!);

                markers.current.set(car.car_id, marker);
            }
        });
    }, [nearbyCars, selectedCarId]);

    // Update route line
    useEffect(() => {
        if (!map.current || !map.current.getSource(routeSourceId)) return;

        const source = map.current.getSource(routeSourceId) as maplibregl.GeoJSONSource;

        if (routeCoordinates && routeCoordinates.length > 0) {
            source.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: routeCoordinates,
                },
            });

            // Fit bounds to show route
            const bounds = new maplibregl.LngLatBounds();
            routeCoordinates.forEach(coord => bounds.extend(coord as [number, number]));
            if (userLocation) bounds.extend([userLocation.lng, userLocation.lat]);

            map.current.fitBounds(bounds, { padding: 50 });
        } else {
            source.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: [],
                },
            });
        }
    }, [routeCoordinates, userLocation]);

    return (
        <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
            <div
                ref={mapContainer}
                className="map-container w-full h-full absolute inset-0"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}
