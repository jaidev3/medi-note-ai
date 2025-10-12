import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { authApi, UserProfile, LoginRequest, RegisterRequest } from "@/lib";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const userProfile = await authApi.getCurrentUser(token);
          setUser(userProfile);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);
    localStorage.setItem("access_token", response.access_token);
    localStorage.setItem("refresh_token", response.refresh_token);

    const userProfile = await authApi.getCurrentUser(response.access_token);
    setUser(userProfile);
    navigate("/dashboard");
  };

  const register = async (userData: RegisterRequest) => {
    await authApi.register(userData);
    // After registration, auto-login
    await login({ email: userData.email, password: userData.password });
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      navigate("/login");
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
