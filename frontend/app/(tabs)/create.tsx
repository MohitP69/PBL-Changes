import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import {
  Camera,
  MapPin,
  Hash,
  X,
  ImageIcon,
} from "lucide-react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useTravelPosts } from "@/hooks/useTravelPosts";
import * as ImageManipulator from "expo-image-manipulator";

// Compress and process image
const processImage = async (
  result: ImagePicker.ImagePickerResult
) => {
  if (
    result.canceled ||
    !result.assets[0]
  ) {
    return null;
  }

  const asset = result.assets[0];

  try {
    console.log(
      "Original image URI:",
      asset.uri
    );

    const manipResult =
      await ImageManipulator.manipulateAsync(
        asset.uri,
        [
          {
            resize: {
              width: 1200,
            },
          },
        ],
        {
          compress: 0.7,
          format:
            ImageManipulator.SaveFormat
              .JPEG,
        }
      );

    console.log(
      "Processed image URI:",
      manipResult.uri
    );

    return manipResult.uri;
  } catch (error) {
    console.error(
      "Error processing image:",
      error
    );

    Alert.alert(
      "Image Processing Error",
      "Failed to process the image. Please try another one."
    );

    return null;
  }
};

export default function CreatePostScreen() {
  const [description, setDescription] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [hashtags, setHashtags] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [showModal, setShowModal] =
    useState(false);

  const [modalType, setModalType] =
    useState<"success" | "error">(
      "success"
    );

  const [modalMessage, setModalMessage] =
    useState("");

  const [isPosting, setIsPosting] =
    useState(false);

  const [isLoadingLocation, setIsLoadingLocation] =
    useState(false);

  const [isProcessingImage, setIsProcessingImage] =
    useState(false);

  const insets = useSafeAreaInsets();

  const { createPost } =
    useTravelPosts();

  const requestPermissions =
    async () => {
      if (Platform.OS !== "web") {
        const {
          status: imageStatus,
        } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        const {
          status: cameraStatus,
        } =
          await ImagePicker.requestCameraPermissionsAsync();

        const {
          status: locationStatus,
        } =
          await Location.requestForegroundPermissionsAsync();

        if (
          imageStatus !== "granted" ||
          cameraStatus !== "granted"
        ) {
          setModalType("error");

          setModalMessage(
            "Camera and photo library permissions are required to add images."
          );

          setShowModal(true);

          return false;
        }

        if (
          locationStatus !== "granted"
        ) {
          console.log(
            "Location permission not granted"
          );
        }
      }

      return true;
    };

  const handleImagePicker =
    async () => {
      const hasPermissions =
        await requestPermissions();

      if (!hasPermissions) {
        return;
      }

      try {
        setIsProcessingImage(true);

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            }
          );

        const processedUri =
          await processImage(result);

        if (processedUri) {
          setSelectedImage(
            processedUri
          );
        }
      } catch (error) {
        console.error(
          "Error picking image:",
          error
        );

        setModalType("error");

        setModalMessage(
          "Failed to select image. Please try again."
        );

        setShowModal(true);
      } finally {
        setIsProcessingImage(false);
      }
    };

  const handleCamera =
    async () => {
      const hasPermissions =
        await requestPermissions();

      if (!hasPermissions) {
        return;
      }

      try {
        setIsProcessingImage(true);

        const result =
          await ImagePicker.launchCameraAsync(
            {
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            }
          );

        const processedUri =
          await processImage(result);

        if (processedUri) {
          setSelectedImage(
            processedUri
          );
        }
      } catch (error) {
        console.error(
          "Error taking photo:",
          error
        );

        setModalType("error");

        setModalMessage(
          "Failed to take photo. Please try again."
        );

        setShowModal(true);
      } finally {
        setIsProcessingImage(false);
      }
    };

  const getCurrentLocation =
    async () => {
      if (Platform.OS === "web") {
        setModalType("error");

        setModalMessage(
          "Location detection is not available on web. Please enter location manually."
        );

        setShowModal(true);

        return;
      }

      setIsLoadingLocation(true);

      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setModalType("error");

          setModalMessage(
            "Location permission is required to detect your current location."
          );

          setShowModal(true);

          return;
        }

        const locationResult =
          await Location.getCurrentPositionAsync(
            {}
          );

        const reverseGeocode =
          await Location.reverseGeocodeAsync(
            {
              latitude:
                locationResult.coords
                  .latitude,

              longitude:
                locationResult.coords
                  .longitude,
            }
          );

        if (
          reverseGeocode.length > 0
        ) {
          const address =
            reverseGeocode[0];

          const locationString =
            `${address.city || address.subregion || ""}, ${
              address.region ||
              address.country ||
              ""
            }`;

          setLocation(
            locationString.replace(
              /^, |, $/g,
              ""
            )
          );
        }
      } catch (error) {
        console.error(
          "Error getting location:",
          error
        );

        setModalType("error");

        setModalMessage(
          "Failed to get current location. Please enter location manually."
        );

        setShowModal(true);
      } finally {
        setIsLoadingLocation(false);
      }
    };

  const handlePost =
    async () => {
      if (!description.trim()) {
        setModalType("error");

        setModalMessage(
          "Please add a description for your post."
        );

        setShowModal(true);

        return;
      }

      if (!location.trim()) {
        setModalType("error");

        setModalMessage(
          "Please add a location for your post."
        );

        setShowModal(true);

        return;
      }

      if (!hashtags.trim()) {
        setModalType("error");

        setModalMessage(
          "Please add hashtags for your post."
        );

        setShowModal(true);

        return;
      }

      if (!selectedImage) {
        setModalType("error");

        setModalMessage(
          "Please add an image to your post."
        );

        setShowModal(true);

        return;
      }

      setIsPosting(true);

      try {
        console.log(
          "Creating post..."
        );

        console.log(
          "Image URI:",
          selectedImage
        );

        await createPost({
          description:
            description.trim(),

          location:
            location.trim(),

          hashtags:
            hashtags.trim(),

          image:
            selectedImage,
        });

        setModalType("success");

        setModalMessage(
          "Your travel story has been posted successfully!"
        );

        setShowModal(true);
      } catch (error) {
        console.error(
          "Error creating post:",
          error
        );

        setModalType("error");

        setModalMessage(
          error instanceof Error
            ? error.message
            : "Failed to create post. Please try again."
        );

        setShowModal(true);
      } finally {
        setIsPosting(false);
      }
    };

  const handleCloseModal =
    () => {
      setShowModal(false);

      if (
        modalType === "success"
      ) {
        setDescription("");
        setLocation("");
        setHashtags("");
        setSelectedImage(null);

        router.push(
          "/(tabs)/home"
        );
      }
    };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop:
            insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >
          <X
            color="#ffffff"
            size={24}
          />
        </TouchableOpacity>

        <Text
          style={
            styles.headerTitle
          }
        >
          Create Post
        </Text>

        <TouchableOpacity
          onPress={handlePost}
          style={[
            styles.postButton,
            isPosting &&
              styles.postButtonDisabled,
          ]}
          disabled={isPosting}
        >
          {isPosting ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
            />
          ) : (
            <Text
              style={
                styles.postButtonText
              }
            >
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
      >
        {isProcessingImage ? (
          <View
            style={
              styles.processingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#22c55e"
            />

            <Text
              style={
                styles.processingText
              }
            >
              Processing image...
            </Text>
          </View>
        ) : selectedImage ? (
          <View
            style={
              styles.imageContainer
            }
          >
            <Image
              source={{
                uri: selectedImage,
              }}
              style={
                styles.selectedImage
              }
              resizeMode="cover"
            />

            <TouchableOpacity
              style={
                styles.changeImageButton
              }
              onPress={
                handleImagePicker
              }
            >
              <Text
                style={
                  styles.changeImageText
                }
              >
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={
              styles.imageSelectionContainer
            }
          >
            <TouchableOpacity
              style={
                styles.imageSelector
              }
              onPress={
                handleImagePicker
              }
            >
              <View
                style={
                  styles.imagePlaceholder
                }
              >
                <ImageIcon
                  color="#6b7280"
                  size={48}
                />

                <Text
                  style={
                    styles.imagePlaceholderText
                  }
                >
                  Choose from Gallery
                </Text>
              </View>
            </TouchableOpacity>

            {Platform.OS !==
              "web" && (
              <TouchableOpacity
                style={
                  styles.imageSelector
                }
                onPress={
                  handleCamera
                }
              >
                <View
                  style={
                    styles.imagePlaceholder
                  }
                >
                  <Camera
                    color="#6b7280"
                    size={48}
                  />

                  <Text
                    style={
                      styles.imagePlaceholderText
                    }
                  >
                    Take Photo
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View
          style={
            styles.inputSection
          }
        >
          <View
            style={
              styles.inputContainer
            }
          >
            <MapPin
              color="#22c55e"
              size={20}
            />

            <TextInput
              style={styles.input}
              placeholder="Add location..."
              placeholderTextColor="#6b7280"
              value={location}
              onChangeText={
                setLocation
              }
            />

            {Platform.OS !==
              "web" && (
              <TouchableOpacity
                style={
                  styles.locationButton
                }
                onPress={
                  getCurrentLocation
                }
                disabled={
                  isLoadingLocation
                }
              >
                {isLoadingLocation ? (
                  <ActivityIndicator
                    size="small"
                    color="#22c55e"
                  />
                ) : (
                  <Text
                    style={
                      styles.locationButtonText
                    }
                  >
                    Current
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View
            style={
              styles.inputContainer
            }
          >
            <Hash
              color="#22c55e"
              size={20}
            />

            <TextInput
              style={styles.input}
              placeholder="Add hashtags (e.g., #travel #adventure)"
              placeholderTextColor="#6b7280"
              value={hashtags}
              onChangeText={
                setHashtags
              }
            />
          </View>

          <TextInput
            style={
              styles.descriptionInput
            }
            placeholder="Share your travel story..."
            placeholderTextColor="#6b7280"
            value={description}
            onChangeText={
              setDescription
            }
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View
          style={
            styles.tipsSection
          }
        >
          <Text
            style={
              styles.tipsTitle
            }
          >
            Tips for great posts:
          </Text>

          <Text
            style={
              styles.tipText
            }
          >
            • Share unique
            experiences and
            hidden gems
          </Text>

          <Text
            style={
              styles.tipText
            }
          >
            • Use relevant
            hashtags to reach
            more travelers
          </Text>

          <Text
            style={
              styles.tipText
            }
          >
            • Add specific
            location details
          </Text>

          <Text
            style={
              styles.tipText
            }
          >
            • Include travel tips
            for other adventurers
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={
          handleCloseModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalContent
            }
          >
            <Text
              style={[
                styles.modalTitle,
                modalType ===
                  "error" &&
                  styles.modalTitleError,
              ]}
            >
              {modalType ===
              "success"
                ? "Success!"
                : "Error"}
            </Text>

            <Text
              style={
                styles.modalMessage
              }
            >
              {modalMessage}
            </Text>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={
                handleCloseModal
              }
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#111827",
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#374151",
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#ffffff",
    },

    postButton: {
      backgroundColor:
        "#22c55e",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },

    postButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#ffffff",
    },

    postButtonDisabled: {
      backgroundColor:
        "#6b7280",
    },

    content: {
      flex: 1,
      padding: 20,
    },

    processingContainer: {
      backgroundColor:
        "#1f2937",
      borderRadius: 12,
      height: 200,
      justifyContent:
        "center",
      alignItems: "center",
      marginBottom: 24,
    },

    processingText: {
      fontSize: 16,
      color: "#6b7280",
      marginTop: 12,
    },

    imageSelector: {
      flex: 1,
      marginBottom: 24,
    },

    selectedImage: {
      width: "100%",
      height: 200,
      borderRadius: 12,
      resizeMode: "cover",
    },

    imagePlaceholder: {
      backgroundColor:
        "#1f2937",
      borderRadius: 12,
      height: 200,
      justifyContent:
        "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor:
        "#374151",
      borderStyle: "dashed",
    },

    imagePlaceholderText: {
      fontSize: 16,
      color: "#6b7280",
      marginTop: 12,
    },

    inputSection: {
      marginBottom: 24,
    },

    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#1f2937",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
    },

    input: {
      flex: 1,
      fontSize: 16,
      color: "#ffffff",
      marginLeft: 12,
    },

    descriptionInput: {
      backgroundColor:
        "#1f2937",
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: "#ffffff",
      minHeight: 120,
    },

    tipsSection: {
      backgroundColor:
        "#1f2937",
      borderRadius: 12,
      padding: 16,
    },

    tipsTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#22c55e",
      marginBottom: 12,
    },

    tipText: {
      fontSize: 14,
      color: "#d1d5db",
      marginBottom: 8,
      lineHeight: 20,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(0, 0, 0, 0.5)",
      justifyContent:
        "center",
      alignItems: "center",
    },

    modalContent: {
      backgroundColor:
        "#1f2937",
      borderRadius: 12,
      padding: 24,
      marginHorizontal: 20,
      alignItems: "center",
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#ffffff",
      marginBottom: 12,
    },

    modalMessage: {
      fontSize: 14,
      color: "#d1d5db",
      textAlign: "center",
      marginBottom: 20,
    },

    modalButton: {
      backgroundColor:
        "#22c55e",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },

    modalButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#ffffff",
    },

    modalTitleError: {
      color: "#ef4444",
    },

    imageSelectionContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },

    imageContainer: {
      marginBottom: 24,
    },

    changeImageButton: {
      backgroundColor:
        "#374151",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 12,
      alignSelf: "center",
    },

    changeImageText: {
      fontSize: 14,
      color: "#22c55e",
      fontWeight: "500",
    },

    locationButton: {
      backgroundColor:
        "#22c55e",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 8,
    },

    locationButtonText: {
      fontSize: 12,
      color: "#ffffff",
      fontWeight: "500",
    },
  });