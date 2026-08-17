import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const vehicleApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

vehicleApi.interceptors.request.use(
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

export const getCustomerVehicles = async (
  customerId
) => {
  const response = await vehicleApi.get(
    `/api/v1/vehicles/customer/${customerId}`
  );

  return response.data;
};

export const getVehicle = async (
  vehicleId
) => {
  const response = await vehicleApi.get(
    `/api/v1/vehicles/${vehicleId}`
  );

  return response.data;
};

export const getAllVehicles = async () => {
  const response = await vehicleApi.get(
    "/api/v1/vehicles/all"
  );

  return response.data;
};

export default vehicleApi;