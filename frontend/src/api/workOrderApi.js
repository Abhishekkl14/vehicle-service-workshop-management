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

export const submitWorkOrderForApproval = async (
  workOrderId
) => {
  const response = await workOrderApi.post(
    `/api/v1/work-orders/${workOrderId}/submit-for-approval`
  );

  return response.data;
};

export const getPendingApprovalWorkOrders =
  async () => {
    const response = await workOrderApi.get(
      "/api/v1/work-orders/pending-approval"
    );

    return response.data;
  };

export const approveWorkOrder = async (
  workOrderId,
  comments = null
) => {
  const response = await workOrderApi.post(
    `/api/v1/work-orders/${workOrderId}/approve`,
    { comments }
  );

  return response.data;
};

export const rejectWorkOrder = async (
  workOrderId,
  rejectionReason
) => {
  const response = await workOrderApi.post(
    `/api/v1/work-orders/${workOrderId}/reject`,
    { rejection_reason: rejectionReason }
  );

  return response.data;
};

export const getWorkOrderApprovals = async (
  workOrderId
) => {
  const response = await workOrderApi.get(
    `/api/v1/work-orders/${workOrderId}/approvals`
  );

  return response.data;
};

export default workOrderApi;
