import { useState, useEffect } from "react";

export interface Reward {
    id: string;
    name: string;
    description: string;
    points: number;
    image: string;
    category: string;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    color: string;
    earned: boolean;
    progress?: number;
}

const mockRewards: Reward[] = [
    {
        id: "1",
        name: "10% off at Spice Route Restaurant",
        description: "Valid for dine-in only. Expires in 30 days.",
        points: 100,
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200",
        category: "dining",
    },
    {
        id: "2",
        name: "Free rickshaw ride in Jaipur",
        description: "Experience the Pink City in style",
        points: 250,
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200",
        category: "transport",
    },
    {
        id: "3",
        name: "Heritage Hotel Stay Voucher",
        description: "One night stay at selected heritage properties",
        points: 500,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200",
        category: "accommodation",
    },
];

const mockBadges: Badge[] = [
    {
        id: "1",
        name: "Explorer",
        description: "Completed 5 different states",
        color: "#22c55e",
        earned: true,
    },
    {
        id: "2",
        name: "Eco-Traveler",
        description: "Used public transport 10 times",
        color: "#3b82f6",
        earned: true,
    },
    {
        id: "3",
        name: "State Hopper",
        description: "Visited 3 different states",
        color: "#f59e0b",
        earned: true,
    },
    {
        id: "4",
        name: "Wayfarer",
        description: "Take 5 more trips to unlock",
        color: "#6b7280",
        earned: false,
        progress: 60,
    },
    {
        id: "5",
        name: "Green Guru",
        description: "Use public transport 10 more times",
        color: "#6b7280",
        earned: false,
        progress: 30,
    },
    {
        id: "6",
        name: "Interstate Voyager",
        description: "Visit 5 more states",
        color: "#6b7280",
        earned: false,
        progress: 20,
    },
];

export function useRewards() {
    const [userPoints, setUserPoints] = useState(1250);
    const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setAvailableRewards(mockRewards);
            setBadges(mockBadges);
            setLoading(false);
        }, 800);
    }, []);

    const redeemReward = (rewardId: string): boolean => {
        const reward = availableRewards.find(r => r.id === rewardId);
        if (reward && userPoints >= reward.points) {
            setUserPoints(prev => prev - reward.points);
            // Handle reward redemption logic
            return true;
        }
        return false;
    };

    return {
        userPoints,
        availableRewards,
        badges,
        loading,
        redeemReward,
    };
}