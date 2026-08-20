import api from "./axios";

export async function loginUser(email, password) {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const response = await api.post(
    "/api/v1/auth/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get("/api/v1/auth/me");
  return response.data;
}

export async function registerUser(data) {
  // data: { first_name, last_name, email, phone, password }
  const response = await api.post(
    "/api/v1/auth/register",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}