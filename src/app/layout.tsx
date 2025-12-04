import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "AtlasRide AI - Autonomous Car Simulation",
    description: "Real-time autonomous car circulation simulation platform using OpenStreetMap and OSRM routing",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
