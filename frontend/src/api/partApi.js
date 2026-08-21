import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL;

const partApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

partApi.interceptors.request.use(
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

export const getActiveParts = async () => {
  const response = await partApi.get(
    "/api/v1/parts/"
  );

  return response.data;
};

export const getWorkOrderParts = async (
  workOrderId
) => {
  const response = await partApi.get(
    `/api/v1/work-orders/${workOrderId}/parts`
  );

  return response.data;
};

export const addWorkOrderPart = async (
  workOrderId,
  partData
) => {
  const response = await partApi.post(
    `/api/v1/work-orders/${workOrderId}/parts`,
    partData
  );

  return response.data;
};

export default partApi;
