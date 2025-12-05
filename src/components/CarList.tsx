import React from 'react';
import { NearbyCar } from '@/types';
import { Car, Navigation } from 'lucide-react';

interface CarListProps {
    cars: NearbyCar[];
    selectedCarId?: string;
    onSelect: (carId: string) => void;
}

export default function CarList({ cars, selectedCarId, onSelect }: CarListProps) {
    if (cars.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                <Car className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No cars nearby</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-4 overflow-y-auto h-[74%] custom-scrollbar">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Car className="w-6 h-6 text-primary" />
                Available Cars ({cars.length})
            </h2>

            {cars.map((car) => (
                <div
                    key={car.car_id}
                    onClick={() => onSelect(car.car_id)}
                    className={`
                        cursor-pointer p-4 rounded-xl border transition-all duration-200
                        flex items-center justify-between group
                        ${selectedCarId === car.car_id
                            ? 'bg-primary/10 border-primary shadow-md scale-[1.02]'
                            : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                        }
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className={`
                            p-2 rounded-full 
                            ${selectedCarId === car.car_id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'}
                        `}>
                            <Car className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">
                                Atlas Car <span className="text-xs opacity-70">#{car.car_id.slice(0, 4)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {car.distance_km.toFixed(1)} km away
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xs font-medium bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                            Available
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
