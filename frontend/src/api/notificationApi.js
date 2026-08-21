import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL;

const notificationApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

notificationApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

export const getNotifications = async (
  unreadOnly = false
) => {
  const response = await notificationApi.get(
    "/api/v1/notifications",
    {
      params: {
        unread_only: unreadOnly,
      },
    }
  );

  return response.data;
};

export const getNotification = async (
  notificationId
) => {
  const response = await notificationApi.get(
    `/api/v1/notifications/${notificationId}`
  );

  return response.data;
};

export const markNotificationRead = async (
  notificationId
) => {
  const response = await notificationApi.post(
    `/api/v1/notifications/${notificationId}/read`
  );

  return response.data;
};

export default notificationApi;
