'use client';

import { useEffect, useState } from 'react';
import { NearbyCar, MapClickPoint } from '@/types';
import { api } from '@/lib/api';
import MapView from '@/components/MapView';
import CarList from '@/components/CarList';
import ChatPanel from '@/components/ChatPanel';
import { Car, RefreshCw, MapPin, MessageSquare } from 'lucide-react';

export default function Home() {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyCars, setNearbyCars] = useState<NearbyCar[]>([]);
    const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [dropoffLocation, setDropoffLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectionMode, setSelectionMode] = useState<'idle' | 'selectingPickup' | 'selectingDropoff'>('idle');
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Get User Location
    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserLocation(loc);

                // Set default pickup to user location if not set
                if (!pickupLocation) {
                    setPickupLocation(loc);
                }
                setError(null);
            },
            (err) => {
                console.error('Location error:', err);
                setError('Unable to retrieve your location');
            },
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);


    // Fetch Cars - Show ALL cars initially, filter to 5 nearest when dropoff is set
    useEffect(() => {
        if (!userLocation && !pickupLocation) return;

        const fetchCars = async () => {
            try {
                if (dropoffLocation) {
                    // When dropoff is set, show only 5 nearest cars to dropoff
                    const allCars = await api.getNearbyCars({
                        userLat: dropoffLocation.lat,
                        userLng: dropoffLocation.lng,
                        radiusKm: 100 // Large radius to get all cars
                    });
                    // Sort by distance and take only top 5
                    const nearest5 = allCars.slice(0, 5);
                    setNearbyCars(nearest5);
                } else {
                    // No dropoff set, show ALL cars from database
                    const center = pickupLocation || userLocation;
                    if (!center) return;

                    const allCars = await api.getNearbyCars({
                        userLat: center.lat,
                        userLng: center.lng,
                        radiusKm: 1000 // Very large radius to get all cars
                    });
                    setNearbyCars(allCars);
                }
            } catch (err) {
                console.error('Failed to fetch cars:', err);
            }
        };

        // Initial fetch
        fetchCars();

        // Poll every 5 seconds
        const interval = setInterval(fetchCars, 5000);
        return () => clearInterval(interval);
    }, [userLocation, pickupLocation, dropoffLocation]);


    // Calculate Route between Pickup and Dropoff
    const fetchRoute = async (p: { lat: number; lng: number }, d: { lat: number; lng: number }) => {
        console.log('fetchRoute called with pickup:', p, 'dropoff:', d);
        setIsLoading(true);
        try {
            const route = await api.getRoutePickupToDropoff({
                pickupLat: p.lat,
                pickupLng: p.lng,
                dropoffLat: d.lat,
                dropoffLng: d.lng
            });
            console.log('Route fetched successfully, coordinates count:', route.coordinates?.length);
            setRouteCoordinates(route.coordinates);
        } catch (err) {
            console.error('Failed to calculate route:', err);
            setRouteCoordinates(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Map Click
    const handleMapClick = (point: MapClickPoint) => {
        console.log('handleMapClick called with point:', point, 'selectionMode:', selectionMode);

        if (selectionMode === 'selectingPickup') {
            console.log('Setting pickup location:', point);
            setPickupLocation(point);
            setSelectionMode('idle');
            // If dropoff exists, recalculate route
            if (dropoffLocation) {
                console.log('Dropoff exists, fetching route');
                fetchRoute(point, dropoffLocation);
            } else {
                console.log('No dropoff, clearing route');
                setRouteCoordinates(null);
            }
        } else if (selectionMode === 'selectingDropoff') {
            console.log('Setting dropoff location:', point);
            setDropoffLocation(point);
            setSelectionMode('idle');
            // If pickup exists, calculate route
            if (pickupLocation) {
                console.log('Pickup exists, fetching route from:', pickupLocation, 'to:', point);
                fetchRoute(pickupLocation, point);
            } else {
                console.log('No pickup location set!');
            }
        } else {
            console.log('Not in selection mode, selectionMode is:', selectionMode);
        }
    };

    // Handle Car Selection & Route
    const handleCarSelect = async (carId: string) => {
        if (selectedCarId === carId) {
            // Deselect
            setSelectedCarId(null);
            // If we have a pickup->dropoff route, keep it. Otherwise clear.
            if (!pickupLocation || !dropoffLocation) {
                setRouteCoordinates(null);
            } else {
                // Re-fetch pickup->dropoff route to be safe/consistent
                fetchRoute(pickupLocation, dropoffLocation);
            }
            return;
        }

        setSelectedCarId(carId);
        setIsLoading(true);

        const target = pickupLocation || userLocation;

        if (target) {
            try {
                const route = await api.getCarToUserRoute({
                    carId,
                    userLat: target.lat,
                    userLng: target.lng
                });
                setRouteCoordinates(route.coordinates);
            } catch (err) {
                console.error('Failed to calculate route:', err);
                // Fallback: clear route if failed
                setRouteCoordinates(null);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Handle car updates from chat commands
    const handleChatCarsUpdate = (cars: NearbyCar[], highlightCarId: string | null) => {
        setNearbyCars(cars);
        setSelectedCarId(highlightCarId);
        setRouteCoordinates(null); // Clear any existing route
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <header className="glass border-b border-border px-6 py-4 flex items-center justify-between z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                            AtlasRide
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">Autonomous Mobility</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Location Controls */}
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectionMode('selectingPickup');
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${selectionMode === 'selectingPickup'
                                ? 'bg-green-500 text-white border-green-600 shadow-md scale-105'
                                : 'bg-background/50 hover:bg-green-500/10 border-border text-foreground'
                                }`}
                        >
                            {pickupLocation ? 'Change Pickup' : 'Set Pickup'}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('Set Dropoff button clicked');
                                setSelectionMode('selectingDropoff');
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${selectionMode === 'selectingDropoff'
                                ? 'bg-red-500 text-white border-red-600 shadow-md scale-105'
                                : 'bg-background/50 hover:bg-red-500/10 border-border text-foreground'
                                }`}
                        >
                            {dropoffLocation ? 'Change Dropoff' : 'Set Dropoff'}
                        </button>
                    </div>

                    {userLocation ? (
                        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            GPS Active
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-full border border-yellow-500/20">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            Locating...
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex relative">
                {/* Sidebar - Car List */}
                <aside className="w-96 glass border-r border-border flex flex-col z-10 shadow-xl transition-all duration-300 ease-in-out absolute md:relative h-full -translate-x-full md:translate-x-0">
                    <div className="p-4 border-b border-border">
                        <h2 className="font-semibold mb-2">Ride Details</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-muted-foreground">Pickup:</span>
                                <span className="font-medium truncate">
                                    {pickupLocation ? `${pickupLocation.lat.toFixed(4)}, ${pickupLocation.lng.toFixed(4)}` : 'Not set'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="text-muted-foreground">Dropoff:</span>
                                <span className="font-medium truncate">
                                    {dropoffLocation ? `${dropoffLocation.lat.toFixed(4)}, ${dropoffLocation.lng.toFixed(4)}` : 'Not set'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <CarList
                        cars={nearbyCars}
                        selectedCarId={selectedCarId || undefined}
                        onSelect={handleCarSelect}
                    />
                </aside>

                {/* Map Area */}
                <main className="flex-1 relative bg-muted/20">
                    <MapView
                        userLocation={userLocation}
                        pickupLocation={pickupLocation}
                        dropoffLocation={dropoffLocation}
                        nearbyCars={nearbyCars}
                        selectedCarId={selectedCarId}
                        routeCoordinates={routeCoordinates}
                        onMapClick={handleMapClick}
                        mode={selectionMode}
                    />

                    {/* Selection Mode Overlay */}
                    {selectionMode !== 'idle' && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-background/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-primary/20 animate-in fade-in slide-in-from-top-4">
                            <p className="text-sm font-medium text-primary flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Tap map to set {selectionMode === 'selectingPickup' ? 'pickup' : 'dropoff'} location
                            </p>
                        </div>
                    )}

                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-sm">
                            <div className="bg-background/80 p-4 rounded-full shadow-lg border border-border animate-spin">
                                <RefreshCw className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    )}

                    {/* Error Toast */}
                    {error && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Floating Chat Button */}
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="absolute bottom-6 right-6 z-40 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg border-2 border-primary-foreground/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    >
                        <MessageSquare className="w-6 h-6" />
                    </button>

                    {/* Floating Chat Panel */}
                    {isChatOpen && (
                        <div className="absolute bottom-24 right-6 z-40 w-96 h-[500px] bg-background rounded-lg shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 fade-in">
                            <ChatPanel
                                userLat={userLocation?.lat || null}
                                userLng={userLocation?.lng || null}
                                onCarsUpdate={handleChatCarsUpdate}
                            />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
