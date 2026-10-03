import { apiRequest } from "./api";

export interface TripPoint {
  latitude: number;
  longitude: number;
  t: number;
}

export interface Trip {
  id: string;
  status: "active" | "completed" | "abandoned";
  startedAt: string;
  endedAt?: string;
  distanceMeters: number;
  durationSeconds: number;
}

export const tripsApi = {
  start: (latitude: number, longitude: number): Promise<Trip> =>
    apiRequest("/trips/start", {
      method: "POST",
      body: { latitude, longitude },
    }),

  end: (tripId: string, route: TripPoint[]): Promise<Trip> =>
    apiRequest(`/trips/${tripId}/end`, {
      method: "POST",
      body: { route },
    }),

  getMine: (): Promise<Trip[]> => apiRequest("/trips"),
};