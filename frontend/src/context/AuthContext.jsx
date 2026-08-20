import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const tokenData = await loginUser(email, password);

    localStorage.setItem(
      "access_token",
      tokenData.access_token
    );

    const currentUser = await getCurrentUser();

    setUser(currentUser);

    return currentUser;
  };

  const register = async (data) => {
    // data: { first_name, last_name, email, phone, password }
    const tokenData = await registerUser(data);

    // Backend returns TokenResponse { access_token }
    localStorage.setItem(
      "access_token",
      tokenData.access_token
    );

    const currentUser = await getCurrentUser();
    setUser(currentUser);

    return currentUser;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}