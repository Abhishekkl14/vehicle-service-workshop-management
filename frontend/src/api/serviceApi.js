import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL;

const serviceApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

serviceApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

export const getActiveServices =
  async () => {

    const response =
      await serviceApi.get(
        "/api/v1/services/"
      );

    return response.data;
  };

export const getService =
  async (serviceId) => {

    const response =
      await serviceApi.get(
        `/api/v1/services/${serviceId}`
      );

    return response.data;
  };

export const getWorkOrderServices =
  async (workOrderId) => {

    const response =
      await serviceApi.get(
        `/api/v1/work-orders/${workOrderId}/services`
      );

    return response.data;
  };

export const addWorkOrderService =
  async (workOrderId, serviceData) => {

    const response =
      await serviceApi.post(
        `/api/v1/work-orders/${workOrderId}/services`,
        serviceData
      );

    return response.data;
  };

export default serviceApi;
