import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const estimateApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

estimateApi.interceptors.request.use(
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

export const getEstimate = async (
  estimateId
) => {
  const response = await estimateApi.get(
    `/api/v1/estimates/${estimateId}`
  );

  return response.data;
};

export const getWorkOrderEstimates = async (
  workOrderId
) => {
  const response = await estimateApi.get(
    `/api/v1/estimates/work-order/${workOrderId}`
  );

  return response.data;
};

export const createApproval = async (
  estimateId,
  approvalData
) => {
  const response = await estimateApi.post(
    `/api/v1/estimates/${estimateId}/approval`,
    approvalData
  );

  return response.data;
};

export default estimateApi;
