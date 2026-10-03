import { useState, useEffect, useCallback } from "react";
import { profileApi } from "../lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedYear: string;
}

interface UserStats {
  trips: number;
  points: number;
  badges: number;
}

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileApi.getProfile();
      setUser(data);
      setStats({
        trips: data.tripsCompleted || 0,
        points: data.points || 0,
        badges: data.badges?.length || 0,
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setLoading(true);
      const updatedProfile = await profileApi.updateProfile(updates);
      setUser((prev) => (prev ? { ...prev, ...updatedProfile } : updatedProfile));
      return updatedProfile;
    } catch (err) {
      console.error("Error updating profile:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    stats,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
  };
}
