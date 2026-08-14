import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const invoiceApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

invoiceApi.interceptors.request.use(
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

export const getInvoice = async (
  invoiceId
) => {
  const response = await invoiceApi.get(
    `/api/v1/invoices/${invoiceId}`
  );

  return response.data;
};

export const getWorkOrderInvoice = async (
  workOrderId
) => {
  const response = await invoiceApi.get(
    `/api/v1/invoices/work-order/${workOrderId}`
  );

  return response.data;
};

export default invoiceApi;
