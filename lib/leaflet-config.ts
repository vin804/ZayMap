import { LatLngTuple, LatLngBoundsLiteral } from "leaflet";

export const YANGON_COORDINATES: LatLngTuple = [16.8661, 96.1951];

// Hpa Khant, Kachin State, Myanmar (where user's shop is located)
export const HPA_KHANT_COORDINATES: LatLngTuple = [25.6044, 96.3070];

export const DEFAULT_ZOOM = 13;

// Myanmar boundaries: [south-west, north-east]
export const MYANMAR_BOUNDS: LatLngBoundsLiteral = [
  [9.5, 92.2],  // South-West corner
  [28.5, 101.2] // North-East corner
];

export const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function isLeafletAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const L = require("leaflet");
    return !!L;
  } catch {
    return false;
  }
}

export function getLeaflet() {
  if (typeof window === "undefined") return null;
  
  try {
    return require("leaflet");
  } catch {
    return null;
  }
}
