import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const workOrderApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

workOrderApi.interceptors.request.use(
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

export const getWorkOrder = async (
  workOrderId
) => {
  const response = await workOrderApi.get(
    `/api/v1/work-orders/${workOrderId}`
  );

  return response.data;
};

export const getWorkOrdersByStatus = async (
  workOrderStatus
) => {
  const response = await workOrderApi.get(
    `/api/v1/work-orders/status/${workOrderStatus}`
  );

  return response.data;
};

export const createWorkOrder = async (
  workOrderData
) => {
  const response = await workOrderApi.post(
    "/api/v1/work-orders/",
    workOrderData
  );

  return response.data;
};

export const startWorkOrder = async (
  workOrderId
) => {
  const response = await workOrderApi.post(
    `/api/v1/work-orders/${workOrderId}/start`
  );

  return response.data;
};

export const completeWorkOrder = async (
  workOrderId
) => {
  const response = await workOrderApi.post(
    `/api/v1/work-orders/${workOrderId}/complete`
  );

  return response.data;
};

export default workOrderApi;
