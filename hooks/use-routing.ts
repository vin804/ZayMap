"use client";

import { useState, useCallback } from "react";

export interface RouteStep {
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
  type: string;
}

export interface RouteData {
  coordinates: [number, number][]; // [lat, lng] array
  steps: RouteStep[];
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
}

interface UseRoutingOptions {
  userLat: number;
  userLon: number;
  shopLat: number;
  shopLon: number;
}

export function useRouting() {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getRoute({ userLat, userLon, shopLat, shopLon }: UseRoutingOptions) {
    console.log("getRoute called with:", { userLat, userLon, shopLat, shopLon });
    
    if (!userLat || !userLon || !shopLat || !shopLon) {
      console.error("Invalid coordinates", { userLat, userLon, shopLat, shopLon });
      setError("Invalid coordinates");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data;
      
      // Try OpenRouteService with API key
      const API_KEY = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY || '';
      
      if (API_KEY) {
        try {
          const response = await fetch(`https://api.heigit.org/routing/v2/directions/driving-car?api_key=${API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coordinates: [
                [userLon, userLat],
                [shopLon, shopLat]
              ],
              instructions: true,
              units: 'm',
              geometry_format: 'geojson'
            })
          });

          if (response.ok) {
            data = await response.json();
            console.log("OpenRouteService API success");
          } else {
            console.warn("OpenRouteService API error:", response.status);
          }
        } catch (fetchError) {
          console.warn("OpenRouteService network error:", fetchError);
        }
      }
      
      // Try OSRM demo server as fallback (no API key needed)
      if (!data) {
        try {
          console.log("Trying OSRM demo server...");
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${shopLon},${shopLat}?overview=full&geometries=geojson&steps=true`;
          const osrmResponse = await fetch(osrmUrl);
          
          if (osrmResponse.ok) {
            const osrmData = await osrmResponse.json();
            console.log("OSRM API success");
            // Convert OSRM format to match OpenRouteService format
            if (osrmData.routes && osrmData.routes[0]) {
              const osrmRoute = osrmData.routes[0];
              // Debug: log first few steps to see what OSRM returns
              const rawSteps = osrmRoute.legs[0].steps.slice(0, 3).map((s: {maneuver: object, name: string}) => ({maneuver: s.maneuver, name: s.name}));
              console.log("OSRM raw steps:", JSON.stringify(rawSteps, null, 2));
              console.log("Full first step:", JSON.stringify(osrmRoute.legs[0].steps[0], null, 2));
              data = {
                routes: [{
                  geometry: osrmRoute.geometry,
                  summary: {
                    distance: osrmRoute.distance,
                    duration: osrmRoute.duration
                  },
                  segments: [{
                    steps: osrmRoute.legs[0].steps.map((step: {
                      maneuver: { instruction?: string; type?: string; modifier?: string; bearing_before?: number; bearing_after?: number };
                      distance: number;
                      duration: number;
                      name: string;
                      ref?: string;
                    }) => {
                      // Build instruction from maneuver type and modifier
                      const type = step.maneuver.type || 'continue';
                      const modifier = step.maneuver.modifier || '';
                      const streetName = step.name && step.name !== '-' ? step.name : (step.ref || '');
                      
                      let instruction = '';
                      
                      // Build instruction based on type and modifier
                      switch (type) {
                        case 'depart':
                          const direction = getBearingDirection(step.maneuver.bearing_after || 0);
                          instruction = `Head ${direction}`;
                          break;
                        case 'turn':
                          if (modifier) {
                            instruction = `Turn ${modifier}`;
                          } else {
                            instruction = 'Turn';
                          }
                          break;
                        case 'continue':
                          instruction = 'Continue';
                          break;
                        case 'uturn':
                          instruction = 'Make U-turn';
                          break;
                        case 'arrive':
                          instruction = 'Arrive at destination';
                          break;
                        default:
                          instruction = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
                      }
                      
                      // Add street name if available
                      if (streetName && !instruction.includes(streetName)) {
                        instruction = `${instruction} on ${streetName}`;
                      }
                      
                      return {
                        instruction: instruction,
                        distance: step.distance,
                        duration: step.duration,
                        type: type
                      };
                    })
                  }]
                }]
              };
            }
          } else {
            console.warn("OSRM API error:", osrmResponse.status);
          }
        } catch (osrmError) {
          console.warn("OSRM network error:", osrmError);
        }
      }
      
      if (data && data.routes && data.routes[0]) {
        const routeData = data.routes[0];
        const geometry = routeData.geometry;
        
        // Decode polyline if needed (ORS returns encoded polyline)
        let coordinates: [number, number][] = [];
        
        console.log("Geometry type:", typeof geometry, "value:", geometry?.substring?.(0, 50) || geometry);
        
        if (geometry) {
          if (typeof geometry === 'string') {
            // Geometry is an encoded polyline string
            console.log("Decoding encoded polyline, length:", geometry.length);
            coordinates = decodePolyline(geometry);
          } else if (geometry.coordinates && Array.isArray(geometry.coordinates)) {
            // GeoJSON format - Convert [lng, lat] to [lat, lng] for Leaflet
            console.log("Using GeoJSON coordinates, count:", geometry.coordinates.length);
            coordinates = geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          }
        }

        // Fallback: use waypoints from segment if no coordinates
        if (coordinates.length === 0 && routeData.segments && routeData.segments[0]) {
          const segment = routeData.segments[0];
          if (segment.way_points && Array.isArray(segment.way_points)) {
            console.log("Using way_points from segment");
            // This would need the full geometry decoding
          }
        }

        console.log("Final coordinates count:", coordinates.length);
        if (coordinates.length > 0) {
          console.log("First coordinate:", coordinates[0], "Last coordinate:", coordinates[coordinates.length - 1]);
        }

        // Parse steps
        const steps: RouteStep[] = [];
        if (routeData.segments && routeData.segments[0] && routeData.segments[0].steps) {
          console.log("First step data:", routeData.segments[0].steps[0]);
          console.log("All step instructions:", JSON.stringify(routeData.segments[0].steps.map((s: {instruction: string, name?: string}) => ({instruction: s.instruction, name: s.name})), null, 2));
          routeData.segments[0].steps.forEach((step: {
            instruction: string;
            distance: number;
            duration: number;
            type: number;
            name?: string;
          }) => {
            // Format instruction with street name if available
            let instruction = step.instruction;
            if (step.name && step.name !== '-' && !instruction.includes(step.name)) {
              instruction = `${step.instruction} ${step.name}`;
            }
            steps.push({
              instruction: instruction,
              distance: step.distance,
              duration: step.duration,
              type: getInstructionType(step.type)
            });
          });
        }

        // If no coordinates from API, use direct line fallback
        if (coordinates.length === 0) {
          console.log("No coordinates from API, using direct line fallback");
          coordinates = [[userLat, userLon], [shopLat, shopLon]];
        }

        setRoute({
          coordinates,
          steps,
          totalDistance: routeData.summary?.distance || 0,
          totalDuration: routeData.summary?.duration || 0
        });
      } else {
        // Fallback to direct line when no API data
        console.log("Using direct line fallback (no API data)");
        const directDistance = calculateDistance(userLat, userLon, shopLat, shopLon);
        const fallbackRoute: RouteData = {
          coordinates: [[userLat, userLon], [shopLat, shopLon]],
          steps: [{
            instruction: `Head to ${shopLat.toFixed(4)}, ${shopLon.toFixed(4)}`,
            distance: directDistance * 1000,
            duration: 0,
            type: "depart"
          }],
          totalDistance: directDistance * 1000,
          totalDuration: 0
        };
        console.log("Setting fallback route with coordinates:", fallbackRoute.coordinates);
        setRoute(fallbackRoute);
      }
    } catch (err) {
      console.error("Routing error:", err);
      setError("Failed to get directions");
      
      // Fallback to direct line
      const directRoute: RouteData = {
        coordinates: [[userLat, userLon], [shopLat, shopLon]],
        steps: [{
          instruction: "Direct route to destination",
          distance: calculateDistance(userLat, userLon, shopLat, shopLon) * 1000,
          duration: 0,
          type: "depart"
        }],
        totalDistance: calculateDistance(userLat, userLon, shopLat, shopLon) * 1000,
        totalDuration: 0
      };
      setRoute(directRoute);
    } finally {
      setLoading(false);
    }
  }

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return {
    route,
    loading,
    error,
    getRoute,
    clearRoute
  };
}

// Helper to convert ORS/OSRM step type to readable type
function getInstructionType(type: number | string): string {
  // OSRM returns string types like "turn", "continue", etc.
  if (typeof type === 'string') {
    return type || 'continue';
  }
  
  // OpenRouteService returns number types
  const types: Record<number, string> = {
    0: "depart",
    1: "turn",
    2: "turn",
    3: "turn",
    4: "turn",
    5: "turn",
    6: "turn",
    7: "turn",
    8: "turn",
    9: "turn",
    10: "turn",
    11: "turn",
    12: "uturn",
    13: "continue",
    14: "roundabout",
    15: "roundabout",
    16: "roundabout",
    17: "roundabout",
    18: "roundabout",
    19: "roundabout",
    20: "roundabout",
    21: "roundabout",
    22: "roundabout",
    23: "roundabout",
    24: "roundabout",
    25: "arrive",
    34: "roundabout",
    35: "roundabout",
    36: "roundabout",
    37: "roundabout"
  };
  return types[type] || "continue";
}

// Helper to convert bearing (0-360) to cardinal direction
function getBearingDirection(bearing: number): string {
  const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Polyline decoder - decodes Google's encoded polyline format
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// Simple distance calculation (fallback)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
