import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import createContextHook from "@nkzw/create-context-hook";
import { postsApi } from "../lib/api";
import { useAuth } from "./AuthContext";

export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
  email?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  user: User;
  location: string;
  image: string | undefined;
  description: string;
  hashtags: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  createdAt: string;
}

export interface CreatePostData {
  description: string;
  location: string;
  hashtags: string;
  image: string | undefined;
}

export const [
  TravelPostsProvider,
  useTravelPosts,
] = createContextHook(() => {
  const [posts, setPosts] = useState<Post[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const { user: currentUser } =
    useAuth();

  // --------------------------------------------------
  // FETCH POSTS
  // --------------------------------------------------

  const fetchPosts = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const allPosts =
          await postsApi.getAllPosts();

        setPosts(
          allPosts.sort(
            (
              a: Post,
              b: Post,
            ) =>
              new Date(
                b.createdAt,
              ).getTime() -
              new Date(
                a.createdAt,
              ).getTime(),
          ),
        );
      } catch (err) {
        console.error(
          "Error fetching posts:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch posts",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // --------------------------------------------------
  // CREATE POST
  // --------------------------------------------------

  const createPost = useCallback(
    async (
      postData: CreatePostData,
    ) => {
      if (
        !postData.description.trim() ||
        !postData.location.trim() ||
        !postData.hashtags.trim()
      ) {
        throw new Error(
          "Description, location, and hashtags are required",
        );
      }

      if (!postData.image) {
        throw new Error(
          "Image is required",
        );
      }

      console.log(
        "Creating post with image URI:",
        postData.image,
      );

      /*
       * IMPORTANT:
       *
       * We do NOT convert the image to
       * Base64 anymore.
       *
       * The image URI is passed directly
       * to postsApi.createPost().
       *
       * postsApi.createPost() will create
       * FormData and send the image as
       * multipart/form-data.
       */

      const newPost =
        await postsApi.createPost({
          description:
            postData.description.trim(),

          location:
            postData.location.trim(),

          hashtags:
            postData.hashtags.trim(),

          image:
            postData.image,
        });

      setPosts(
        (prevPosts) => [
          newPost,
          ...prevPosts,
        ],
      );

      return newPost;
    },
    [],
  );

  // --------------------------------------------------
  // LIKE POST
  // --------------------------------------------------

  const likePost = useCallback(
    async (postId: string) => {
      // Optimistic update
      setPosts(
        (prevPosts) =>
          prevPosts.map(
            (post) =>
              post.id === postId
                ? {
                    ...post,

                    isLiked:
                      !post.isLiked,

                    likes:
                      post.isLiked
                        ? post.likes -
                          1
                        : post.likes +
                          1,
                  }
                : post,
          ),
      );

      try {
        await postsApi.likePost(
          postId,
        );
      } catch (error) {
        // Revert on error
        setPosts(
          (prevPosts) =>
            prevPosts.map(
              (post) =>
                post.id === postId
                  ? {
                      ...post,

                      isLiked:
                        !post.isLiked,

                      likes:
                        post.isLiked
                          ? post.likes +
                            1
                          : post.likes -
                            1,
                    }
                  : post,
            ),
        );

        throw error;
      }
    },
    [],
  );

  // --------------------------------------------------
  // ADD COMMENT
  // --------------------------------------------------

  const addComment = useCallback(
    async (
      postId: string,
      commentText: string,
    ) => {
      if (!commentText.trim()) {
        throw new Error(
          "Comment cannot be empty",
        );
      }

      if (!currentUser) {
        throw new Error(
          "You must be logged in to comment",
        );
      }

      try {
        const response =
          await postsApi.addComment(
            postId,
            commentText.trim(),
          );

        const newComment =
          response.comment;

        setPosts(
          (prevPosts) =>
            prevPosts.map(
              (post) =>
                post.id === postId
                  ? {
                      ...post,

                      comments: [
                        ...post.comments,
                        newComment,
                      ],
                    }
                  : post,
            ),
        );

        return newComment;
      } catch (error) {
        console.error(
          "Error adding comment:",
          error,
        );

        throw error;
      }
    },
    [currentUser],
  );

  // --------------------------------------------------
  // DELETE COMMENT
  // --------------------------------------------------

  const deleteComment = useCallback(
    async (
      postId: string,
      commentId: string,
    ) => {
      try {
        await postsApi.deleteComment(
          postId,
          commentId,
        );

        setPosts(
          (prevPosts) =>
            prevPosts.map(
              (post) =>
                post.id === postId
                  ? {
                      ...post,

                      comments:
                        post.comments.filter(
                          (c) =>
                            c.id !==
                            commentId,
                        ),
                    }
                  : post,
            ),
        );
      } catch (error) {
        console.error(
          "Error deleting comment:",
          error,
        );

        throw error;
      }
    },
    [],
  );

  // --------------------------------------------------
  // DELETE POST
  // --------------------------------------------------

  const deletePost = useCallback(
    async (postId: string) => {
      try {
        await postsApi.deletePost(
          postId,
        );

        setPosts(
          (prevPosts) =>
            prevPosts.filter(
              (post) =>
                post.id !== postId,
            ),
        );
      } catch (error) {
        console.error(
          "Error deleting post:",
          error,
        );

        throw error;
      }
    },
    [],
  );

  // --------------------------------------------------
  // UPDATE POST
  // --------------------------------------------------

  const updatePost = useCallback(
    async (
      postId: string,
      updates: {
        description?: string;
        location?: string;
        hashtags?: string;
        image?: string;
      },
    ) => {
      try {
        /*
         * Do NOT convert image to Base64.
         *
         * If image is a local URI, postsApi.updatePost()
         * will send it through FormData.
         *
         * If image is already an HTTP URL, it can be
         * sent normally as an existing image URL.
         */

        const updatedPost =
          await postsApi.updatePost(
            postId,
            updates,
          );

        setPosts(
          (prevPosts) =>
            prevPosts.map(
              (post) =>
                post.id === postId
                  ? updatedPost
                  : post,
            ),
        );

        return updatedPost;
      } catch (error) {
        console.error(
          "Error updating post:",
          error,
        );

        throw error;
      }
    },
    [],
  );

  // --------------------------------------------------
  // INITIAL FETCH
  // --------------------------------------------------

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // --------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------

  return useMemo(
    () => ({
      posts,
      loading,
      error,
      currentUser,
      fetchPosts,
      createPost,
      likePost,
      addComment,
      deleteComment,
      deletePost,
      updatePost,
    }),
    [
      posts,
      loading,
      error,
      currentUser,
      fetchPosts,
      createPost,
      likePost,
      addComment,
      deleteComment,
      deletePost,
      updatePost,
    ],
  );
});