'use client';

import { MapClickPoint } from '@/types';
import { MapPin, Navigation, X, Loader2 } from 'lucide-react';

interface SpawnCarModalProps {
    startPoint: MapClickPoint | null;
    endPoint: MapClickPoint | null;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export default function SpawnCarModal({
    startPoint,
    endPoint,
    onConfirm,
    onCancel,
    isLoading,
}: SpawnCarModalProps) {
    const canConfirm = startPoint && endPoint;

    return (
        <div className="glass rounded-lg shadow-2xl p-6 min-w-[400px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary" />
                    Spawn New Car
                </h3>
                <button
                    onClick={onCancel}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                    <div className={`
            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${startPoint ? 'bg-accent' : 'bg-secondary'}
          `}>
                        <MapPin className={`w-4 h-4 ${startPoint ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Start Point</p>
                        {startPoint ? (
                            <p className="text-xs text-muted-foreground font-mono">
                                {startPoint.lat.toFixed(5)}, {startPoint.lng.toFixed(5)}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground">Click on the map to set start point</p>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className={`
            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${endPoint ? 'bg-red-500' : 'bg-secondary'}
          `}>
                        <MapPin className={`w-4 h-4 ${endPoint ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Destination</p>
                        {endPoint ? (
                            <p className="text-xs text-muted-foreground font-mono">
                                {endPoint.lat.toFixed(5)}, {endPoint.lng.toFixed(5)}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                {startPoint ? 'Click on the map to set destination' : 'Set start point first'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="btn-secondary flex-1"
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={!canConfirm || isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Spawning...
                        </>
                    ) : (
                        'Spawn Car'
                    )}
                </button>
            </div>

            {!startPoint && (
                <p className="mt-4 text-xs text-center text-muted-foreground">
                    💡 Tip: Click anywhere on the map to set points
                </p>
            )}
        </div>
    );
}
