import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL;

const bookingApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

bookingApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});

export const getCustomerBookings = async (
  customerId
) => {
  const response = await bookingApi.get(
    `/api/v1/bookings/customer/${customerId}`
  );

  return response.data;
};

export const getBooking = async (
  bookingId
) => {
  const response = await bookingApi.get(
    `/api/v1/bookings/${bookingId}`
  );

  return response.data;
};

export const getBookingsByDate = async (
  bookingDate
) => {
  const response = await bookingApi.get(
    `/api/v1/bookings/date/${bookingDate}`
  );

  return response.data;
};

export const createBooking = async (
  bookingData
) => {
  const response = await bookingApi.post(
    "/api/v1/bookings/",
    bookingData
  );

  return response.data;
};

export default bookingApi;
