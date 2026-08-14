import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const paymentApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

paymentApi.interceptors.request.use(
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

export const getInvoicePayments = async (
  invoiceId
) => {
  const response = await paymentApi.get(
    `/api/v1/payments/invoice/${invoiceId}`
  );

  return response.data;
};

export const createPayment = async (
  paymentData
) => {
  const response = await paymentApi.post(
    "/api/v1/payments",
    paymentData
  );

  return response.data;
};

export default paymentApi;
