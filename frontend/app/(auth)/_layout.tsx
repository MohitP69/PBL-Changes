import { Stack } from "expo-router";
import { View } from "react-native";
import { theme } from "@/constants/theme";

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </View>
  );
}
