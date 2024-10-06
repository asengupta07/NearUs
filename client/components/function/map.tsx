import { memo, useState, useEffect, useRef } from "react";
import { NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { OlaMaps } from "../OlaMapsWebSDK/olamaps-js-sdk.es";
import { color } from "framer-motion";

// Define the types for the props
interface Location {
    name: string;
    longitude: number;
    latitude: number;
    color?: string;
}

interface MapComponentProps {
    height?: string;
    width?: string;
    theme?: string;
    locations: Location[];
}

const MapComponent: React.FC<MapComponentProps> = memo(({ height = "100%", width = "100%", theme = "dark", locations = [] }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    console.log(locations);
    useEffect(() => {
        if (!mapContainerRef.current || locations.length === 0) return;

        const olaMaps = new OlaMaps({
            apiKey: process.env.NEXT_PUBLIC_API_KEY
        });

        if (!mapInstance.current) {
            mapInstance.current = olaMaps.init({
                container: mapContainerRef.current!,
                style: `https://api.olamaps.io/tiles/vector/v1/styles/default-${theme}-standard/style.json`,
                transformRequest: (url: any, resourceType: any) => {
                    if (url.includes("?")) {
                        url += `&api_key=${process.env.NEXT_PUBLIC_API_KEY}`;
                    } else {
                        url += `?api_key=${process.env.NEXT_PUBLIC_API_KEY}`;
                    }
                    return { url, resourceType };
                },
            });

            const nav = new NavigationControl({
                visualizePitch: true,
            });
            mapInstance.current.addControl(nav, "top-left");
        }

        const latitudes = locations.map(coord => coord.latitude);
        const longitudes = locations.map(coord => coord.longitude);
        const bounds = [
            [Math.min(...longitudes), Math.min(...latitudes)],
            [Math.max(...longitudes), Math.max(...latitudes)]
        ];

        mapInstance.current.fitBounds(bounds, { padding: 50 });

        locations.forEach(({ name, longitude, latitude, color }) => {
            const popup = olaMaps.addPopup({ offset: [0, -30], anchor: 'bottom' })
                .setHTML(`<div style="color: black;">${name}</div>`);

            olaMaps
                .addMarker({ offset: [0, 0], anchor: "bottom", color: `${color? color: 'red'}` })
                .setLngLat([longitude, latitude])
                .setPopup(popup)
                .addTo(mapInstance.current);
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [theme, locations]);

    return (
        <div
            ref={mapContainerRef}
            style={{ width, height, overflow: "hidden" }}
            id="central-map"
        />
    );
});
MapComponent.displayName = "MapComponent";  
export default MapComponent;
