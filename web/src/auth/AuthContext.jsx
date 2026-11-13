import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, request, setSessionExpiredHandler, tokenStore } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";

const AuthContext = createContext(null);

// status: "loading" (đang hỏi /auth/me) | "ready" (đã đăng nhập) | "guest"
export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (tokenStore.access ? "loading" : "guest"));

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus("guest");
      toast.info("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    });

    if (!tokenStore.access) return;
    api
      .get("/auth/me")
      .then((me) => {
        setUser(me);
        setStatus("ready");
      })
      .catch(() => {
        tokenStore.clear();
        setStatus("guest");
      });
  }, [toast]);

  const login = useCallback(async (email, password) => {
    const data = await request("POST", "/auth/login", { email, password }, { auth: false });
    tokenStore.save(data);
    setUser(data.user);
    setStatus("ready");
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      // Backend hủy refresh token và đưa access token vào danh sách thu hồi (Redis)
      await api.post("/auth/logout");
    } catch {
      /* token đã hết hạn thì vẫn đăng xuất phía trình duyệt */
    }
    tokenStore.clear();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
