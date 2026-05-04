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

// Street map (OpenStreetMap)
export const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Satellite imagery (ESRI World Imagery)
export const SATELLITE_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const SATELLITE_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

// Labels overlay (CartoDB Voyager Labels)
export const LABELS_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";
export const LABELS_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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
