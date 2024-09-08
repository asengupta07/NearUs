"use client";

import { useState, useEffect, useRef } from "react";
import { NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { OlaMaps } from "../OlaMapsWebSDK/olamaps-js-sdk.es";
import { memo } from "react";

const MapComponent = memo(({ height = "100%", width = "100%", theme = "dark", locations = [] }) => {
    const mapContainerRef = useRef(null); // Ref for the map container
    const mapInstance = useRef(null); // Ref to store the map instance

    useEffect(() => {
        if (!mapContainerRef.current || locations.length === 0) return; // Ensure the map container is available and there are locations

        const olaMaps = new OlaMaps({
            apiKey: process.env.NEXT_PUBLIC_API_KEY
        });

        // Initialize map only once
        if (!mapInstance.current) {
            mapInstance.current = olaMaps.init({
                container: mapContainerRef.current, // Use ref for the container
                style: `https://api.olamaps.io/tiles/vector/v1/styles/default-${theme}-standard/style.json`,
                transformRequest: (url, resourceType) => {
                    if (url.includes("?")) {
                        url += `&api_key=${process.env.NEXT_PUBLIC_API_KEY}`;
                    } else {
                        url += `?api_key=${process.env.NEXT_PUBLIC_API_KEY}`;
                    }
                    return { url, resourceType };
                },
            });

            // Add navigation controls to the map
            const nav = new NavigationControl({
                visualizePitch: true,
            });
            mapInstance.current.addControl(nav, "top-left");
        }

        // Calculate bounds based on provided locations
        const latitudes = locations.map(coord => coord.latitude);
        const longitudes = locations.map(coord => coord.longitude);
        const bounds = [
            [Math.min(...longitudes), Math.min(...latitudes)], // Southwest corner
            [Math.max(...longitudes), Math.max(...latitudes)]  // Northeast corner
        ];

        // Fit the map to bounds
        mapInstance.current.fitBounds(bounds, { padding: 50 });

        // Add markers for each location
        locations.forEach(({ name, longitude, latitude }) => {
            const popup = olaMaps.addPopup({ offset: [0, -30], anchor: 'bottom' })
                .setHTML(`<div style="color: black;">${name}</div>`); // Inline styles for better control

            olaMaps
                .addMarker({ offset: [0, 0], anchor: "bottom" })
                .setLngLat([longitude, latitude])
                .setPopup(popup)
                .addTo(mapInstance.current);
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove(); // Cleanup map on component unmount
                mapInstance.current = null;
            }
        };
    }, [theme, locations]);

    return (
        <div
            ref={mapContainerRef} // Attach ref to the div
            style={{ width, height, overflow: "hidden" }}
            id="central-map"
        />
    );
});

export default MapComponent;
