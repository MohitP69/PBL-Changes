import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Linking,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Navigation } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tripsApi, TripPoint } from "@/lib/tripsApi";

type LatLng = { latitude: number; longitude: number };

const POINTS_PER_KM = 20;

const DESTINATIONS = [
    {
        name: "India Gate",
        desc: "Historical arch",
        latitude: 28.6129,
        longitude: 77.2295,
    },
    {
        name: "Lotus Temple",
        desc: "House of Worship",
        latitude: 28.5535,
        longitude: 77.2588,
    },
];

const toRad = (deg: number) => (deg * Math.PI) / 180;

// Distance between two GPS points in meters (Haversine formula)
const haversineMeters = (a: LatLng, b: LatLng) => {
    const R = 6371000;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
};

// Keep first and last point, thin the rest so the request stays small
const downsample = (points: TripPoint[], max: number) => {
    if (points.length <= max) return points;

    const step = (points.length - 1) / (max - 1);
    const result: TripPoint[] = [];

    for (let i = 0; i < max - 1; i++) {
        result.push(points[Math.round(i * step)]);
    }

    result.push(points[points.length - 1]);
    return result;
};

const formatDistance = (meters: number) =>
    meters < 1000
        ? `${Math.round(meters)} m`
        : `${(meters / 1000).toFixed(1)} km`;

const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

export default function TripsScreen() {
    const insets = useSafeAreaInsets();

    const mapRef = useRef<MapView>(null);
    const watchRef = useRef<Location.LocationSubscription | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const routeRef = useRef<TripPoint[]>([]);
    const lastPointRef = useRef<TripPoint | null>(null);
    const distanceRef = useRef(0);
    const startTimeRef = useRef(0);
    const tripIdRef = useRef<string | null>(null);

    const [tracking, setTracking] = useState(false);
    const [busy, setBusy] = useState(false);
    const [route, setRoute] = useState<TripPoint[]>([]);
    const [distance, setDistance] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [myPos, setMyPos] = useState<LatLng | null>(null);
    const [summary, setSummary] = useState<{
        distanceMeters: number;
        durationSeconds: number;
    } | null>(null);

    const stopWatching = () => {
        if (watchRef.current) {
            watchRef.current.remove();
            watchRef.current = null;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Use the last known position (if permission was already given)
    // so "km away" can be shown. This does not show a permission popup.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const { status } =
                    await Location.getForegroundPermissionsAsync();

                if (status !== "granted") return;

                const last = await Location.getLastKnownPositionAsync();

                if (last && !cancelled) {
                    setMyPos({
                        latitude: last.coords.latitude,
                        longitude: last.coords.longitude,
                    });
                }
            } catch (error) {
                console.log("Could not read last known position:", error);
            }
        })();

        return () => {
            cancelled = true;
            stopWatching();
        };
    }, []);

    const handleLocation = (loc: Location.LocationObject) => {
        const { latitude, longitude, accuracy } = loc.coords;

        // Ignore poor GPS readings
        if (accuracy != null && accuracy > 30) return;

        const point: TripPoint = { latitude, longitude, t: loc.timestamp };
        const last = lastPointRef.current;

        if (last) {
            const d = haversineMeters(last, point);

            // Ignore tiny jumps (GPS noise while standing still)
            if (d < 3) return;

            distanceRef.current += d;
            setDistance(distanceRef.current);
        }

        lastPointRef.current = point;
        routeRef.current.push(point);
        setRoute([...routeRef.current]);
        setMyPos({ latitude, longitude });

        mapRef.current?.animateCamera({ center: { latitude, longitude } });
    };

    const startTrip = async () => {
        setBusy(true);

        try {
            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Location needed",
                    "Please allow location permission to track your trip."
                );
                return;
            }

            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const first: TripPoint = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                t: pos.timestamp,
            };

            const trip = await tripsApi.start(
                first.latitude,
                first.longitude
            );

            tripIdRef.current = trip.id;
            routeRef.current = [first];
            lastPointRef.current = first;
            distanceRef.current = 0;
            startTimeRef.current = Date.now();

            setRoute([first]);
            setDistance(0);
            setElapsed(0);
            setSummary(null);
            setMyPos({
                latitude: first.latitude,
                longitude: first.longitude,
            });

            timerRef.current = setInterval(() => {
                setElapsed(
                    Math.floor((Date.now() - startTimeRef.current) / 1000)
                );
            }, 1000);

            watchRef.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 5,
                    timeInterval: 2000,
                },
                handleLocation
            );

            setTracking(true);
        } catch (error) {
            console.error("Error starting trip:", error);
            stopWatching();

            Alert.alert(
                "Could not start trip",
                error instanceof Error ? error.message : "Please try again."
            );
        } finally {
            setBusy(false);
        }
    };

    const endTrip = async () => {
        stopWatching();
        setBusy(true);

        const tripId = tripIdRef.current;
        const localDuration = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
        );

        try {
            if (!tripId) {
                throw new Error("No active trip found");
            }

            const saved = await tripsApi.end(
                tripId,
                downsample(routeRef.current, 800)
            );

            setSummary({
                distanceMeters: saved.distanceMeters,
                durationSeconds: saved.durationSeconds,
            });
        } catch (error) {
            console.error("Error ending trip:", error);

            setSummary({
                distanceMeters: distanceRef.current,
                durationSeconds: localDuration,
            });

            Alert.alert(
                "Trip not saved",
                error instanceof Error
                    ? error.message
                    : "Could not save the trip to the server."
            );
        } finally {
            tripIdRef.current = null;
            setTracking(false);
            setBusy(false);

            // Show the whole route on the map
            setTimeout(() => {
                if (routeRef.current.length > 1) {
                    mapRef.current?.fitToCoordinates(routeRef.current, {
                        edgePadding: {
                            top: 40,
                            right: 40,
                            bottom: 40,
                            left: 40,
                        },
                        animated: true,
                    });
                }
            }, 300);
        }
    };

    const openDirections = (dest: LatLng) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;

        Linking.openURL(url).catch(() =>
            Alert.alert("Could not open Google Maps")
        );
    };

    const showCard = tracking || summary !== null;
    const shownDistance = summary && !tracking ? summary.distanceMeters : distance;
    const shownDuration = summary && !tracking ? summary.durationSeconds : elapsed;
    const shownPoints = Math.floor((shownDistance / 1000) * POINTS_PER_KM);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Trip Logging</Text>
            </View>

            <ScrollView style={styles.content}>
                {showCard && (
                    <View style={styles.activeTripCard}>
                        <View style={styles.tripHeader}>
                            <Text style={styles.tripTitle}>
                                {tracking
                                    ? "Journey in Progress"
                                    : "Journey Complete"}
                            </Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    !tracking && styles.statusBadgeDone,
                                ]}
                            >
                                <Text style={styles.statusText}>
                                    {tracking ? "Active" : "Completed"}
                                </Text>
                            </View>
                        </View>

                        {route.length > 0 && (
                            <View style={styles.mapContainer}>
                                <MapView
                                    ref={mapRef}
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: route[0].latitude,
                                        longitude: route[0].longitude,
                                        latitudeDelta: 0.005,
                                        longitudeDelta: 0.005,
                                    }}
                                    showsUserLocation={tracking}
                                >
                                    <Marker
                                        coordinate={route[0]}
                                        title="Start"
                                        pinColor="#22c55e"
                                    />

                                    {route.length > 1 && (
                                        <Polyline
                                            coordinates={route}
                                            strokeWidth={5}
                                            strokeColor="#22c55e"
                                        />
                                    )}
                                </MapView>
                            </View>
                        )}

                        <View style={styles.tripStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Distance</Text>
                                <Text style={styles.statValue}>
                                    {formatDistance(shownDistance)}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Points</Text>
                                <Text style={styles.statValue}>
                                    {shownPoints}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Duration</Text>
                                <Text style={styles.statValue}>
                                    {formatDuration(shownDuration)}
                                </Text>
                            </View>
                        </View>

                        {tracking && (
                            <TouchableOpacity
                                style={[
                                    styles.endTripButton,
                                    busy && styles.buttonDisabled,
                                ]}
                                onPress={endTrip}
                                disabled={busy}
                            >
                                {busy ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.endTripText}>
                                        End Trip
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.suggestedSection}>
                    <Text style={styles.sectionTitle}>
                        Suggested Destinations
                    </Text>

                    {DESTINATIONS.map((dest) => (
                        <View key={dest.name} style={styles.destinationCard}>
                            <View style={styles.destinationInfo}>
                                <Text style={styles.destinationName}>
                                    {dest.name}
                                </Text>
                                <Text style={styles.destinationDesc}>
                                    {dest.desc}
                                </Text>
                                <View style={styles.destinationMeta}>
                                    <Navigation color="#22c55e" size={16} />
                                    <Text style={styles.destinationDistance}>
                                        {myPos
                                            ? `${formatDistance(
                                                  haversineMeters(myPos, dest)
                                              )} away`
                                            : "Open in Google Maps"}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.directionsButton}
                                onPress={() => openDirections(dest)}
                            >
                                <Text style={styles.directionsText}>
                                    Directions
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {!tracking && (
                    <TouchableOpacity
                        style={[
                            styles.startTripButton,
                            busy && styles.buttonDisabled,
                        ]}
                        onPress={startTrip}
                        disabled={busy}
                    >
                        {busy ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.startTripText}>
                                Start New Trip
                            </Text>
                        )}
                    </TouchableOpacity>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827",
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#ffffff",
        textAlign: "center",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    activeTripCard: {
        backgroundColor: "#1f2937",
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    tripHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    tripTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#ffffff",
    },
    statusBadge: {
        backgroundColor: "#22c55e",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusBadgeDone: {
        backgroundColor: "#3b82f6",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#ffffff",
    },
    mapContainer: {
        height: 260,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 20,
        backgroundColor: "#374151",
    },
    map: {
        flex: 1,
    },
    tripStats: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    statItem: {
        alignItems: "center",
    },
    statLabel: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "600",
        color: "#ffffff",
    },
    endTripButton: {
        backgroundColor: "#ef4444",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
    },
    endTripText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#ffffff",
    },
    suggestedSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#ffffff",
        marginBottom: 16,
    },
    destinationCard: {
        backgroundColor: "#1f2937",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    destinationInfo: {
        flex: 1,
    },
    destinationName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#ffffff",
        marginBottom: 4,
    },
    destinationDesc: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 8,
    },
    destinationMeta: {
        flexDirection: "row",
        alignItems: "center",
    },
    destinationDistance: {
        fontSize: 14,
        color: "#22c55e",
        marginLeft: 6,
    },
    directionsButton: {
        backgroundColor: "#374151",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    directionsText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#ffffff",
    },
    startTripButton: {
        backgroundColor: "#22c55e",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 20,
    },
    startTripText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#ffffff",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});