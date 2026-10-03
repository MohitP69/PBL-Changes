import createContextHook from "@nkzw/create-context-hook";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { auth } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  // getIdToken,
} from "firebase/auth";
import { apiRequest } from "@/lib/api";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatar?: string;
  points: number;
  badges: string[];
  tripsCompleted: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(
  () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const syncUserWithBackend = useCallback(async (firebaseUser: any) => {
      try {
        const backendResponse = await apiRequest("/auth/user", {
          method: "POST",
          body: {
            name: firebaseUser.displayName,
            avatar: firebaseUser.photoURL,
          },
        });

        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: backendResponse.user.name || firebaseUser.displayName,
          avatar: backendResponse.user.avatar || firebaseUser.photoURL,
          points: backendResponse.user.points,
          badges: backendResponse.user.badges,
          tripsCompleted: backendResponse.user.tripsCompleted,
        };

        setUser(userData);
      } catch (error) {
        console.error("Error syncing with backend:", error);
        // If backend sync fails, logout the user to prevent inconsistent state
        await signOut(auth);
      }
    }, []);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          await syncUserWithBackend(firebaseUser);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    }, [syncUserWithBackend]);

    const login = async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)/home");
    };

    const register = async (email: string, password: string, name: string) => {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(firebaseUser, { displayName: name });
      router.replace("/(tabs)/home");
    };

    const logout = async () => {
      await signOut(auth);
      router.replace("/(auth)/login");
    };

    return {
      user,
      isLoading,
      login,
      register,
      logout,
    };
  }
);