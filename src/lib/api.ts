import { CarWithPosition, SpawnCarRequest, NearbyCar, CarToUserRoute } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
    // Get all cars with positions
    async getCars(): Promise<CarWithPosition[]> {
        const response = await fetch(`${API_URL}/api/cars`);
        if (!response.ok) {
            throw new Error('Failed to fetch cars');
        }
        return response.json();
    },

    // Spawn a new car
    async spawnCar(request: SpawnCarRequest): Promise<any> {
        const response = await fetch(`${API_URL}/api/spawn-car`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to spawn car');
        }

        return response.json();
    },

    // Reset simulation
    async resetSimulation(): Promise<void> {
        const response = await fetch(`${API_URL}/api/reset`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to reset simulation');
        }
    },

    // Get route between two points
    async getRoute(startLng: number, startLat: number, endLng: number, endLat: number): Promise<any> {
        const url = `${API_URL}/api/route?start_lng=${startLng}&start_lat=${startLat}&end_lng=${endLng}&end_lat=${endLat}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to compute route');
        }

        return response.json();
    },

    // Get nearby cars
    async getNearbyCars(params: { userLat: number; userLng: number; radiusKm?: number }): Promise<NearbyCar[]> {
        const url = `${API_URL}/api/cars/nearby?user_lat=${params.userLat}&user_lng=${params.userLng}&radius_km=${params.radiusKm || 10}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch nearby cars');
        }

        return response.json();
    },

    // Get route from car to user
    async getCarToUserRoute(params: { carId: string; userLat: number; userLng: number }): Promise<CarToUserRoute> {
        const url = `${API_URL}/api/route/car-to-user?car_id=${params.carId}&user_lat=${params.userLat}&user_lng=${params.userLng}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to compute car-to-user route');
        }

        return response.json();
    },

    // Get route from pickup to dropoff
    async getRoutePickupToDropoff(params: {
        pickupLat: number;
        pickupLng: number;
        dropoffLat: number;
        dropoffLng: number;
    }): Promise<{ coordinates: [number, number][], distance: number, duration: number }> {
        // Reusing the existing generic route endpoint
        return this.getRoute(params.pickupLng, params.pickupLat, params.dropoffLng, params.dropoffLat);
    },

    // Send chat message/command
    async sendChatMessage(request: { message: string; userLat: number; userLng: number }): Promise<any> {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: request.message,
                user_lat: request.userLat,
                user_lng: request.userLng,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send chat message');
        }

        return response.json();
    },
};
