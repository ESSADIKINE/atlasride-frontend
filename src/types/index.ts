// TypeScript types and interfaces for AtlasRide AI

export interface Car {
    id: string;
    start_lat: number;
    start_lng: number;
    end_lat: number;
    end_lng: number;
    speed: number;
    status: 'moving' | 'finished' | 'idle';
    created_at: string;
    updated_at: string;
}

export interface CarPosition {
    id: string;
    car_id: string;
    lat: number;
    lng: number;
    heading: number;
    progress: number;
    timestamp: string;
}

export interface Route {
    id: string;
    car_id: string;
    geometry: GeoJSONGeometry;
    distance: number;
    duration: number;
    created_at: string;
}

export interface GeoJSONGeometry {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
}

export interface CarWithPosition {
    id: string;
    start_lat: number;
    start_lng: number;
    end_lat: number;
    end_lng: number;
    speed: number;
    status: string;
    current_lat: number | null;
    current_lng: number | null;
    heading: number | null;
    progress: number | null;
    route_geometry: GeoJSONGeometry | null;
}

export interface SpawnCarRequest {
    start_lng: number;
    start_lat: number;
    end_lng: number;
    end_lat: number;
    speed?: number;
}

export interface MapClickPoint {
    lng: number;
    lat: number;
}

export interface NearbyCar {
    car_id: string;
    lat: number;
    lng: number;
    heading: number;
    distance_km: number;
}

export interface CarToUserRoute {
    car_id: string;
    user_lat: number;
    user_lng: number;
    coordinates: [number, number][];
    distance: number;
    duration: number;
}

export interface ChatRequest {
    message: string;
    user_lat: number;
    user_lng: number;
}

export interface ChatResponse {
    reply: string;
    cars: NearbyCar[];
    highlight_car_id: string | null;
}

export interface ChatMessage {
    from: 'user' | 'bot';
    text: string;
}

