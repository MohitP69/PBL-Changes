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
  Modal,
  TextInput,
} from "react-native";
import {
  Settings,
  Bell,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Award,
  MapPin,
  LogIn,
  Edit3,
} from "lucide-react-native";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/AuthContext";
import { router } from "expo-router";

export default function ProfileScreen() {
  const {
    user: profileUser,
    stats,
    loading: profileLoading,
    error: profileError,
    updateProfile,
    refreshProfile,
  } = useUserProfile();
  const insets = useSafeAreaInsets();
  const { logout, user: authUser, isLoading: authLoading } = useAuth();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const displayedUser = profileUser || authUser;
  const displayedName = profileUser?.name || authUser?.name || "User";
  const displayedAvatar = profileUser?.avatar || authUser?.avatar;

  // Show loading state while profile or auth is loading
  if ((authLoading || profileLoading) && !profileUser && !authUser) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show friendly error state if profile loading failed and no cached user exists
  if (profileError && !profileUser && !authUser) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { paddingTop: insets.top },
        ]}
      >
        <Text style={styles.errorText}>
          {profileError || "Failed to load profile"}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={refreshProfile}
          accessibilityRole="button"
          accessibilityLabel="Retry loading profile"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleOpenEditModal = () => {
    setNameInput(displayedName);
    setIsEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    if (isSaving) return;
    setIsEditModalVisible(false);
  };

  const handleSaveProfile = async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({ name: trimmedName });
      setIsEditModalVisible(false);
      Alert.alert("Success", "Profile name updated successfully.");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update profile name. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsPress = () => {
    Alert.alert(
      "Settings",
      "Account and app preference settings will be available in an upcoming update."
    );
  };

  const menuItems = [
    {
      icon: Bell,
      title: "Notifications",
      hasChevron: true,
      onPress: () =>
        Alert.alert(
          "Notifications",
          "Notification settings will be available soon."
        ),
    },
    {
      icon: Shield,
      title: "Privacy",
      hasChevron: true,
      onPress: () =>
        Alert.alert(
          "Privacy",
          "Your personal data is securely protected and only used for essential app functionality."
        ),
    },
    {
      icon: HelpCircle,
      title: "Help",
      hasChevron: true,
      onPress: () =>
        Alert.alert(
          "Help & Support",
          "For assistance or inquiries, please contact our support team at support@rastasetu.app."
        ),
    },
    {
      icon: Info,
      title: "About",
      hasChevron: true,
      onPress: () =>
        Alert.alert(
          "About Rastasetu",
          "Rastasetu v1.0.0\n\nA travel platform to connect travelers, share journeys, and earn exploration rewards."
        ),
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "An unexpected error occurred";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={handleSettingsPress}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Settings color="#ffffff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <Image source={{ uri: displayedAvatar }} style={styles.profileImage} />
          <Text style={styles.userName}>{displayedName}</Text>
          {displayedUser && (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleOpenEditModal}
              accessibilityRole="button"
              accessibilityLabel="Edit Profile"
              testID="edit-profile-button"
            >
              <Edit3 color="#22c55e" size={14} style={{ marginRight: 6 }} />
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.trips || 0}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.badges || 0}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Award color="#ffffff" size={20} />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>Explorer</Text>
              <Text style={styles.achievementDesc}>
                Completed 5 different states
              </Text>
            </View>
            <Text style={styles.achievementDate}>2 days ago</Text>
          </View>

          <View style={styles.achievementCard}>
            <View
              style={[styles.achievementIcon, { backgroundColor: "#3b82f6" }]}
            >
              <MapPin color="#ffffff" size={20} />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>State Hopper</Text>
              <Text style={styles.achievementDesc}>
                Visited 3 different states
              </Text>
            </View>
            <Text style={styles.achievementDate}>1 week ago</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.menuItem}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <item.icon color="#22c55e" size={20} />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              {item.hasChevron && <ChevronRight color="#6b7280" size={20} />}
            </TouchableOpacity>
          ))}

          {authUser ? (
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Log Out"
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, styles.logoutIcon]}>
                  <LogOut color="#ef4444" size={20} />
                </View>
                <Text style={[styles.menuItemText, styles.logoutText]}>
                  Log Out
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.menuItem, styles.loginItem]}
              onPress={() => router.push("/(auth)/login")}
              accessibilityRole="button"
              accessibilityLabel="Go to Login"
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, styles.loginIcon]}>
                  <LogIn color="#22c55e" size={20} />
                </View>
                <Text style={[styles.menuItemText, styles.loginText]}>
                  Go to Login
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalSubtitle}>Update your display name</Text>

            <TextInput
              style={styles.textInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor="#6b7280"
              autoFocus
              editable={!isSaving}
              accessibilityLabel="Display name"
              testID="edit-name-input"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.cancelButton]}
                onPress={handleCloseEditModal}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Cancel edit"
                testID="cancel-edit-profile-button"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveProfile}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Save profile name"
                testID="save-profile-button"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  userJoined: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22c55e",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  achievementsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  achievementCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 14,
    color: "#6b7280",
  },
  achievementDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  menuSection: {
    marginBottom: 24,
  },
  menuItem: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  logoutItem: {
    marginTop: 16,
  },
  logoutIcon: {
    backgroundColor: "#fef2f2",
  },
  logoutText: {
    color: "#ef4444",
  },
  loginItem: {
    marginTop: 16,
  },
  loginIcon: {
    backgroundColor: "#f0fdf4",
  },
  loginText: {
    color: "#22c55e",
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  editProfileButtonText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#374151",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 20,
    textAlign: "center",
  },
  textInput: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#374151",
  },
  cancelButtonText: {
    color: "#d1d5db",
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#22c55e",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
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
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
