import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Share,
  Alert,
} from "react-native";
import {
  Heart,
  MessageCircle,
  Share as ShareIcon,
  MapPin,
  Send,
  RefreshCw,
  Trash2,
} from "lucide-react-native";
import { useTravelPosts, Post, Comment } from "@/hooks/useTravelPosts";
import { useAuth } from "@/hooks/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function HomeScreen() {
  const {
    posts,
    loading,
    error,
    likePost,
    addComment,
    deleteComment,
    fetchPosts,
    deletePost,
    currentUser,
  } = useTravelPosts();
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const insets = useSafeAreaInsets();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  const showError = (message: string) => {
    if (!message.trim()) return;
    if (message.length > 200) {
      setErrorMessage("Error message too long");
    } else {
      setErrorMessage(message.trim());
    }
    setShowErrorModal(true);
  };

  const confirmDeletePost = (postId: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeletePost(postId),
        },
      ]
    );
  };

  const handleDeletePost = async (postId: string) => {
    if (deletingPostId) return;

    setDeletingPostId(postId);
    try {
      await deletePost(postId);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Failed to delete post. Please try again."
      );
    } finally {
      setDeletingPostId(null);
    }
  };

  const confirmDeleteComment = (postId: string, commentId: string) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteComment(postId, commentId),
        },
      ]
    );
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (deletingCommentId) return;

    setDeletingCommentId(commentId);
    try {
      await deleteComment(postId, commentId);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Failed to delete comment. Please try again."
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  const isPostOwner = (post: Post) => {
    if (!user) return false;
    return Boolean(
      (user.id &&
        (user.id === post.user.id ||
          user.id === (post.user as any).firebaseUid)) ||
        (user.email &&
          post.user.email &&
          user.email.toLowerCase() === post.user.email.toLowerCase()) ||
        (user.name && post.user.name && user.name === post.user.name)
    );
  };

  const isCommentOwner = (comment: Comment) => {
    if (!user) return false;
    return Boolean(
      (user.id &&
        (user.id === comment.userId ||
          user.id === (comment as any).firebaseUid)) ||
        (user.name && comment.userName && user.name === comment.userName)
    );
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
    } catch {
      showError("Failed to like post");
    }
  };

  const handleShare = async (post: Post) => {
    try {
      const contentParts: string[] = [];
      if (post.description?.trim()) {
        contentParts.push(post.description.trim());
      }
      if (post.location?.trim()) {
        contentParts.push(`Location: ${post.location.trim()}`);
      }
      if (post.hashtags?.trim()) {
        contentParts.push(post.hashtags.trim());
      }

      const message = contentParts.join("\n\n");
      if (!message) return;

      const result = await Share.share({
        message,
        title: post.description || "Travel Post",
      });

      if (result.action === Share.sharedAction) {
        // Post shared successfully
      } else if (result.action === Share.dismissedAction) {
        // User dismissed/cancelled sharing on iOS
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.name === "AbortError" ||
          err.message.toLowerCase().includes("cancel") ||
          err.message.toLowerCase().includes("abort"))
      ) {
        // User cancelled sharing
        return;
      }
      showError("Failed to share post. Please try again.");
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentTexts[postId]?.trim();
    if (!commentText) return;

    try {
      await addComment(postId, commentText);
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add comment");
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchPosts();
    } catch (err) {
      console.error("Error refreshing posts:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderComment = (post: Post, comment: Comment) => {
    const isOwnPost = isPostOwner(post);
    const isOwnComment = isCommentOwner(comment);
    const canDelete = isOwnPost || isOwnComment;
    const isDeleting = deletingCommentId === comment.id;

    return (
      <View key={comment.id} style={styles.commentContainer}>
        <Image
          source={{ uri: comment.userAvatar }}
          style={styles.commentAvatar}
          resizeMode="cover"
        />
        <View style={styles.commentContent}>
          <Text style={styles.commentUsername}>{comment.userName}</Text>
          <Text style={styles.commentText}>{comment.text}</Text>
        </View>
        {canDelete && (
          <TouchableOpacity
            style={styles.commentDeleteButton}
            onPress={() => confirmDeleteComment(post.id, comment.id)}
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityLabel="Delete comment"
            testID={`delete-comment-${comment.id}`}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Trash2 color="#9ca3af" size={14} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPost = (post: Post) => {
    const isCommentsExpanded = expandedComments.has(post.id);
    const commentText = commentTexts[post.id] || "";
    const isOwnPost = isPostOwner(post);
    const isDeleting = deletingPostId === post.id;

    return (
      <View key={post.id} style={styles.postContainer}>
        <View style={styles.postHeader}>
          <Image
            source={{ uri: post.user.avatar }}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{post.user.name}</Text>
            <View style={styles.locationContainer}>
              <MapPin color="#6b7280" size={14} />
              <Text style={styles.location}>{post.location}</Text>
            </View>
          </View>
          <View style={styles.postHeaderRight}>
            <View style={styles.pointsContainer}>
              <Text style={styles.points}>{post.user.points}</Text>
            </View>
            {isOwnPost && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDeletePost(post.id)}
                disabled={isDeleting}
                accessibilityRole="button"
                accessibilityLabel="Delete post"
                testID={`delete-post-${post.id}`}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Trash2 color="#ef4444" size={18} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.postImageContainer}>
          <Image
            source={{ uri: post.image }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
            testID={`like-button-${post.id}`}
          >
            <Heart
              color={post.isLiked ? "#ef4444" : "#6b7280"}
              size={24}
              fill={post.isLiked ? "#ef4444" : "none"}
            />
            <Text style={styles.actionText}>{post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleComments(post.id)}
            testID={`comment-button-${post.id}`}
          >
            <MessageCircle color="#6b7280" size={24} />
            <Text style={styles.actionText}>{post.comments.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(post)}
            testID={`share-button-${post.id}`}
          >
            <ShareIcon color="#6b7280" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.postContent}>
          <Text style={styles.postDescription}>{post.description}</Text>
          {post.hashtags && (
            <Text style={styles.postHashtags}>{post.hashtags}</Text>
          )}
        </View>

        {isCommentsExpanded && (
          <View style={styles.commentsSection}>
            {post.comments.map((comment) => renderComment(post, comment))}

            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#6b7280"
                value={commentText}
                onChangeText={(text) =>
                  setCommentTexts((prev) => ({ ...prev, [post.id]: text }))
                }
                multiline
                testID={`comment-input-${post.id}`}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleAddComment(post.id)}
                disabled={!commentText.trim()}
                testID={`send-comment-${post.id}`}
              >
                <Send
                  color={commentText.trim() ? "#22c55e" : "#6b7280"}
                  size={20}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { paddingTop: insets.top },
        ]}
      >
        <Text style={styles.errorText}>Failed to load posts</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPosts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RASTASETU</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw color={refreshing ? "#6b7280" : "#22c55e"} size={20} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.feed}
        contentContainerStyle={
          posts.length === 0 ? styles.emptyFeedContainer : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No travel posts yet.</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to share your journey.
            </Text>
            <TouchableOpacity
              style={styles.createPostButton}
              onPress={() => router.push("/(tabs)/create")}
              accessibilityRole="button"
              accessibilityLabel="Create Post"
            >
              <Text style={styles.createPostButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => renderPost(post))
        )}
      </ScrollView>

      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 2,
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 8,
  },
  feed: {
    flex: 1,
  },
  emptyFeedContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 24,
  },
  createPostButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  postContainer: {
    backgroundColor: "#1f2937",
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#374151",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  location: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
  },
  postHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  pointsContainer: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  points: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  postImageContainer: {
    width: "100%",
    height: 350,
    backgroundColor: "#374151",
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postDescription: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 20,
    marginBottom: 8,
  },
  postHashtags: {
    fontSize: 14,
    color: "#22c55e",
    fontWeight: "500",
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
  commentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  commentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
  },
  commentDeleteButton: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#374151",
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 18,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 16,
    backgroundColor: "#374151",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: "#ffffff",
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendButton: {
    marginLeft: 12,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: "#d1d5db",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});
