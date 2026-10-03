import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { theme } from "../constants/theme";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log("AuthWrapper: Initializing");
    const unsubscribe = onAuthStateChanged(auth, () => {
      console.log("AuthWrapper: Firebase initialized");
      setIsInitialized(true);
    });

    return unsubscribe;
  }, []);

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}
