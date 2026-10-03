import { Platform } from "react-native";
import { auth } from "../config/firebase";

const getApiUrl = () => {
  const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

  if (configuredApiUrl) {
    return configuredApiUrl.endsWith("/api")
      ? configuredApiUrl
      : `${configuredApiUrl}/api`;
  }

  if (__DEV__) {
    return Platform.OS === "android"
      ? "http://192.168.0.109:5000/api"
      : "http://localhost:5000/api";
  }

  return "";
};

export const API_URL = getApiUrl();

interface ApiOptions {
  method?: string;
  body?: any;
}

interface ApiRequestOptions extends ApiOptions {
  onUnauthorized?: () => void;
}

interface RawResponse {
  ok: boolean;
  status: number;
  text: string;
}

// Normal JSON requests: fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number = 60000,
): Promise<RawResponse> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      text,
    };
  } finally {
    clearTimeout(id);
  }
};

/*
 * FormData requests (image uploads) use XMLHttpRequest.
 *
 * Newer Expo SDKs replace the global fetch with an implementation that
 * rejects React Native's { uri, name, type } file parts with
 * "Unsupported FormDataPart implementation". XMLHttpRequest still
 * supports them.
 */
const xhrUpload = (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: FormData,
  timeout: number = 60000,
): Promise<RawResponse> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.timeout = timeout;

    xhr.onload = () => {
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        text: xhr.responseText,
      });
    };

    xhr.onerror = () => {
      reject(new TypeError("Network request failed"));
    };

    xhr.ontimeout = () => {
      const timeoutError = new Error("Request timed out");
      timeoutError.name = "AbortError";
      reject(timeoutError);
    };

    xhr.onabort = () => {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";
      reject(abortError);
    };

    xhr.send(body as any);
  });
};

export async function apiRequest(
  endpoint: string,
  options: ApiRequestOptions = {},
) {
  try {
    const user = auth.currentUser;
    const publicEndpoints = ["/auth/login", "/auth/register"];

    let token: string | null = null;

    if (user && !publicEndpoints.includes(endpoint)) {
      try {
        token = await user.getIdToken();
      } catch (tokenError) {
        console.error("Failed to get ID token:", tokenError);

        if (options.onUnauthorized) {
          options.onUnauthorized();
        }

        throw new Error("User session invalid. Please log in again.");
      }
    }

    const { method = "GET", body } = options;

    const headers: Record<string, string> = {};

    // Do NOT manually set Content-Type for FormData.
    // The multipart boundary must be generated automatically.
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${API_URL}${endpoint}`;

    let response: RawResponse;

    if (isFormData) {
      response = await xhrUpload(url, method, headers, body, 60000);
    } else {
      const config: RequestInit = {
        method,
        headers,
        body:
          body !== undefined && body !== null
            ? JSON.stringify(body)
            : undefined,
      };

      response = await fetchWithTimeout(url, config, 60000);
    }

    if (!response.ok) {
      if (response.status === 401) {
        if (options.onUnauthorized) {
          options.onUnauthorized();
        }

        throw new Error("Your session has expired. Please log in again.");
      }

      let errorMessage: string;

      try {
        const errorData = JSON.parse(response.text);

        errorMessage =
          errorData.message ||
          errorData.error ||
          JSON.stringify(errorData);
      } catch {
        errorMessage = response.text;
      }

      switch (response.status) {
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);

        case 403:
          throw new Error(
            "You don't have permission to perform this action.",
          );

        case 404:
          throw new Error(
            `The requested resource was not found: ${endpoint}`,
          );

        case 413:
          throw new Error(
            "The file you're trying to upload is too large.",
          );

        case 429:
          throw new Error(
            "Too many requests. Please try again later.",
          );

        case 500:
          throw new Error(
            errorMessage ||
              "An unexpected server error occurred. Please try again later.",
          );

        default:
          throw new Error(`Request failed: ${errorMessage}`);
      }
    }

    try {
      return JSON.parse(response.text);
    } catch {
      return null;
    }
  } catch (error) {
    if (
      error instanceof TypeError &&
      (error.message === "Failed to fetch" ||
        error.message === "Network request failed")
    ) {
      throw new Error(
        "Network error. Please check your internet connection and that the backend is running.",
      );
    } else if (
      error instanceof Error &&
      (error.name === "AbortError" ||
        error.message?.includes("canceled") ||
        error.message?.includes("aborted"))
    ) {
      throw new Error(
        "Request timed out. The server might be waking up or unreachable. Please try again.",
      );
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

// Posts API
export const postsApi = {
  getAllPosts: (onUnauthorized?: () => void) =>
    apiRequest("/posts", { onUnauthorized }),

  createPost: (
    data: {
      description: string;
      location: string;
      image: string | undefined;
      hashtags: string;
    },
    onUnauthorized?: () => void,
  ) => {
    const formData = new FormData();

    formData.append("description", data.description);
    formData.append("location", data.location);
    formData.append("hashtags", data.hashtags);

    if (data.image) {
      formData.append(
        "image",
        {
          uri: data.image,
          name: "travel-post.jpg",
          type: "image/jpeg",
        } as any,
      );
    }

    console.log("Creating post with FormData");
    console.log("Image URI:", data.image);

    return apiRequest("/posts", {
      method: "POST",
      body: formData,
      onUnauthorized,
    });
  },

  updatePost: (
    postId: string,
    data: {
      description?: string;
      location?: string;
      image?: string;
      hashtags?: string;
    },
  ) => {
    // New local image: multipart/form-data. Otherwise normal JSON.
    if (data.image) {
      const formData = new FormData();

      if (data.description !== undefined) {
        formData.append("description", data.description);
      }

      if (data.location !== undefined) {
        formData.append("location", data.location);
      }

      if (data.hashtags !== undefined) {
        formData.append("hashtags", data.hashtags);
      }

      formData.append(
        "image",
        {
          uri: data.image,
          name: "travel-post.jpg",
          type: "image/jpeg",
        } as any,
      );

      console.log("Updating post with FormData");
      console.log("New image URI:", data.image);

      return apiRequest(`/posts/${postId}`, {
        method: "PUT",
        body: formData,
      });
    }

    return apiRequest(`/posts/${postId}`, {
      method: "PUT",
      body: data,
    });
  },

  deletePost: (postId: string) =>
    apiRequest(`/posts/${postId}`, {
      method: "DELETE",
    }),

  likePost: (postId: string) =>
    apiRequest(`/posts/${postId}/like`, {
      method: "POST",
    }),

  addComment: (postId: string, text: string) =>
    apiRequest(`/posts/${postId}/comments`, {
      method: "POST",
      body: { text },
    }),

  deleteComment: (postId: string, commentId: string) =>
    apiRequest(`/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    }),
};

// Profile API
export const profileApi = {
  getProfile: (onUnauthorized?: () => void) =>
    apiRequest("/profile", { onUnauthorized }),

  updateProfile: (data: { name?: string; avatar?: string }) =>
    apiRequest("/profile", {
      method: "PUT",
      body: data,
    }),
};

// Rewards API
export const rewardsApi = {
  getRewards: () => apiRequest("/rewards"),

  claimReward: (rewardId: string) =>
    apiRequest(`/rewards/${rewardId}/claim`, {
      method: "POST",
    }),
};