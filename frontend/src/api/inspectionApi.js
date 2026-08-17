import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const inspectionApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

inspectionApi.interceptors.request.use(
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

export const getInspection = async (
  inspectionId
) => {
  const response = await inspectionApi.get(
    `/api/v1/inspections/${inspectionId}`
  );

  return response.data;
};

export const getInspectionByWorkOrderId =
  async (workOrderId) => {

    const response =
      await inspectionApi.get(
        `/api/v1/inspections/work-order/${workOrderId}`
      );

    return response.data;
  };

export const getInspectionItems = async (
  inspectionId
) => {
  const response = await inspectionApi.get(
    `/api/v1/inspections/${inspectionId}/items`
  );

  return response.data;
};

export const createInspection = async (
  inspectionData
) => {
  const response = await inspectionApi.post(
    "/api/v1/inspections/",
    inspectionData
  );

  return response.data;
};

export const addInspectionItem = async (
  inspectionId,
  itemData
) => {
  const response = await inspectionApi.post(
    `/api/v1/inspections/${inspectionId}/items`,
    itemData
  );

  return response.data;
};

export default inspectionApi;
