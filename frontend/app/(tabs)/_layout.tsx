import { Tabs } from "expo-router";
import { Home, Map, Plus, Award, User } from "lucide-react-native";
import React from "react";
import { View, StyleSheet } from "react-native";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#22c55e",
                tabBarInactiveTintColor: "#6b7280",
                tabBarStyle: {
                    backgroundColor: "#1f2937",
                    borderTopColor: "#374151",
                    borderTopWidth: 1,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="trips"
                options={{
                    title: "Trips",
                    tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="create"
                options={{
                    title: "",
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.createButton, focused && styles.createButtonActive]}>
                            <Plus color="#ffffff" size={24} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="rewards"
                options={{
                    title: "Rewards",
                    tabBarIcon: ({ color, size }) => <Award color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    createButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#22c55e",
        justifyContent: "center",
        alignItems: "center",
        marginTop: -10,
    },
    createButtonActive: {
        backgroundColor: "#16a34a",
    },
});