import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL;

const customerHistoryApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

customerHistoryApi.interceptors.request.use(
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

export const getCustomerServiceHistory = async (
  customerId
) => {
  const response =
    await customerHistoryApi.get(
      `/api/v1/customers/${customerId}/service-history`
    );

  return response.data;
};

export default customerHistoryApi;
