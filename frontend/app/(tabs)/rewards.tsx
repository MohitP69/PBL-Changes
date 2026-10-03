import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Award, Star, ChevronRight } from "lucide-react-native";
import { useRewards, Reward } from "@/hooks/useRewards";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RewardsScreen() {
    const { userPoints, availableRewards, badges, loading, redeemReward } = useRewards();
    const insets = useSafeAreaInsets();
    const [redeemingId, setRedeemingId] = useState<string | null>(null);

    const handleRedeem = async (reward: Reward) => {
        if (redeemingId) return;

        if (userPoints < reward.points) {
            Alert.alert("Insufficient Points", "You do not have enough points.");
            return;
        }

        setRedeemingId(reward.id);
        try {
            // Simulate brief processing delay for visual feedback and debouncing
            await new Promise((resolve) => setTimeout(resolve, 500));
            const success = redeemReward(reward.id);
            if (success) {
                Alert.alert("Success", "Reward redeemed successfully.");
            } else {
                Alert.alert("Insufficient Points", "You do not have enough points.");
            }
        } finally {
            setRedeemingId(null);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Loading rewards...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Rewards</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.pointsCard}>
                    <View style={styles.pointsHeader}>
                        <Text style={styles.pointsTitle}>My Points</Text>
                        <ChevronRight color="#6b7280" size={20} />
                    </View>
                    <Text style={styles.pointsValue}>{userPoints}</Text>
                    <Text style={styles.pointsSubtext}>Keep exploring to earn more!</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Rewards</Text>
                    {availableRewards.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyCardText}>No rewards available right now.</Text>
                        </View>
                    ) : (
                        availableRewards.map((reward) => {
                            const canRedeem = userPoints >= reward.points;
                            const isRedeeming = redeemingId === reward.id;
                            const isDisabled = !canRedeem || redeemingId !== null;

                            return (
                                <View key={reward.id} style={styles.rewardCard}>
                                    <Image source={{ uri: reward.image }} style={styles.rewardImage} />
                                    <View style={styles.rewardInfo}>
                                        <Text style={styles.rewardName}>{reward.name}</Text>
                                        <Text style={styles.rewardDescription}>{reward.description}</Text>
                                        <View style={styles.rewardMeta}>
                                            <Star color="#fbbf24" size={16} fill="#fbbf24" />
                                            <Text style={styles.rewardPoints}>{reward.points} points</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.redeemButton, isDisabled && styles.redeemButtonDisabled]}
                                        onPress={() => handleRedeem(reward)}
                                        disabled={isDisabled}
                                        activeOpacity={0.7}
                                    >
                                        {isRedeeming ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Text style={[styles.redeemText, !canRedeem && styles.redeemTextDisabled]}>
                                                Redeem
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Badges</Text>
                    {badges.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyCardText}>No badges available right now.</Text>
                        </View>
                    ) : (
                        <View style={styles.badgesGrid}>
                            {badges.map((badge) => (
                                <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
                                    <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
                                        <Award color="#ffffff" size={24} />
                                    </View>
                                    <Text style={styles.badgeName}>{badge.name}</Text>
                                    <Text style={styles.badgeDescription}>{badge.description}</Text>
                                    {badge.earned && (
                                        <View style={styles.earnedBadge}>
                                            <Text style={styles.earnedText}>Earned</Text>
                                        </View>
                                    )}
                                    {!badge.earned && badge.progress && (
                                        <View style={styles.progressContainer}>
                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[styles.progressFill, { width: `${badge.progress}%` }]}
                                                />
                                            </View>
                                            <Text style={styles.progressText}>{badge.progress}%</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
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
    pointsCard: {
        backgroundColor: "#1f2937",
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: "center",
    },
    pointsHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    pointsTitle: {
        fontSize: 16,
        color: "#6b7280",
        marginRight: 8,
    },
    pointsValue: {
        fontSize: 48,
        fontWeight: "bold",
        color: "#22c55e",
        marginBottom: 8,
    },
    pointsSubtext: {
        fontSize: 14,
        color: "#6b7280",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#ffffff",
        marginBottom: 16,
    },
    rewardCard: {
        backgroundColor: "#1f2937",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    rewardImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 16,
    },
    rewardInfo: {
        flex: 1,
    },
    rewardName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#ffffff",
        marginBottom: 4,
    },
    rewardDescription: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 8,
    },
    rewardMeta: {
        flexDirection: "row",
        alignItems: "center",
    },
    rewardPoints: {
        fontSize: 14,
        color: "#fbbf24",
        marginLeft: 6,
        fontWeight: "500",
    },
    redeemButton: {
        backgroundColor: "#22c55e",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    redeemButtonDisabled: {
        backgroundColor: "#374151",
        opacity: 0.6,
    },
    redeemText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#ffffff",
    },
    redeemTextDisabled: {
        color: "#9ca3af",
    },
    badgesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    badgeCard: {
        backgroundColor: "#1f2937",
        borderRadius: 12,
        padding: 16,
        width: "48%",
        alignItems: "center",
    },
    badgeCardLocked: {
        opacity: 0.6,
    },
    badgeIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    badgeName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#ffffff",
        textAlign: "center",
        marginBottom: 4,
    },
    badgeDescription: {
        fontSize: 12,
        color: "#6b7280",
        textAlign: "center",
        marginBottom: 8,
    },
    earnedBadge: {
        backgroundColor: "#22c55e",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    earnedText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#ffffff",
    },
    progressContainer: {
        width: "100%",
        alignItems: "center",
    },
    progressBar: {
        width: "100%",
        height: 4,
        backgroundColor: "#374151",
        borderRadius: 2,
        marginBottom: 4,
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#22c55e",
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: "#6b7280",
    },
    centerContent: {
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: "#d1d5db",
        marginTop: 16,
    },
    emptyCard: {
        backgroundColor: "#1f2937",
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyCardText: {
        fontSize: 14,
        color: "#9ca3af",
        textAlign: "center",
    },
});