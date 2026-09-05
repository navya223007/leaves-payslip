import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // const verifyUser = React.useCallback(async () => {
  //   try {
  //     const res = await api.get("/api/auth/verify");

  //     setUser(res.data.user);

  //   } catch (error) {

  //     setUser(null);

  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);
  const verifyUser = React.useCallback(async () => {
    try {
      console.log("🔄 VERIFY START");

      const res = await api.get("/api/auth/verify");

      console.log("✅ VERIFY DATA:", res.data);
      console.log("👤 VERIFY USER:", res.data.user);
      console.log("🎭 VERIFY ROLE:", res.data.user?.role);
      console.log("🆔 VERIFY EMP ID:", res.data.user?.emp_id);

      setUser(res.data.user);
    } catch (error) {
      console.error("❌ Session verification failed:", error);
      console.error("❌ Verify response:", error.response?.data);

      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyUser();
  }, [verifyUser]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = React.useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, verifyUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
