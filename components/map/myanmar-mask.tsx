"use client";

import { useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";

interface MyanmarMaskProps {
  map: LeafletMap | null;
}

export function MyanmarMask({ map }: MyanmarMaskProps) {
  useEffect(() => {
    if (!map) return;

    const L = window.L || require("leaflet");

    // Create a pane for the mask overlay
    map.createPane("myanmarMask");
    const maskPane = map.getPane("myanmarMask");
    if (maskPane) {
      maskPane.style.zIndex = "650";
      maskPane.style.pointerEvents = "none";
    }

    // Create a simple rectangular mask with a hole for Myanmar
    // Using L.polygon with a hole (nested arrays)
    const outerBounds: [number, number][] = [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
    ];

    // Myanmar bounding box (approximate)
    const myanmarHole: [number, number][] = [
      [9.5, 92.0],
      [9.5, 101.5],
      [29.0, 101.5],
      [29.0, 92.0],
    ];

    // Create polygon with hole
    const maskLayer = L.polygon([outerBounds, myanmarHole], {
      pane: "myanmarMask",
      fillColor: "#0f0f23",
      fillOpacity: 0.9,
      color: "#667eea",
      weight: 2,
      interactive: false,
    }).addTo(map);

    return () => {
      map.removeLayer(maskLayer);
      map.getPane("myanmarMask")?.remove();
    };
  }, [map]);

  return null;
}
