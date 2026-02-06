import { useState, useEffect } from "react";

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
}

interface UserInfo {
  position: number;
  totalPlayers: number;
  score: number;
  username: string;
  isInTop10: boolean;
  canRecommend: boolean;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  userInfo: UserInfo | null;
}

export const useLeaderboardCache = () => {
  const [cachedLeaderboard, setCachedLeaderboard] = useState<
    LeaderboardEntry[]
  >([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar leaderboard desde la API y guardar en localStorage
  const loadLeaderboard = async (userId?: string) => {
    try {
      console.log("[LeaderboardCache] Cargando leaderboard desde API...");
      const url = userId
        ? `/api/leaderboard?userId=${userId}`
        : "/api/leaderboard";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LeaderboardResponse = await response.json();
      console.log(
        `[LeaderboardCache] Leaderboard cargado: ${data.leaderboard.length} entradas`
      );

      // Guardar en localStorage
      localStorage.setItem(
        "cached-leaderboard",
        JSON.stringify(data.leaderboard)
      );
      localStorage.setItem("leaderboard-timestamp", Date.now().toString());

      setCachedLeaderboard(data.leaderboard);
      setUserInfo(data.userInfo);
      setIsLoaded(true);

      return data;
    } catch (error) {
      console.error("[LeaderboardCache] Error cargando leaderboard:", error);
      setIsLoaded(true);
      return { leaderboard: [], userInfo: null };
    }
  };

  // Obtener leaderboard desde caché o cargar si es necesario
  const getLeaderboard = async (forceRefresh = false, userId?: string) => {
    const cached = localStorage.getItem("cached-leaderboard");
    const timestamp = localStorage.getItem("leaderboard-timestamp");

    // Si hay caché y no es muy viejo (5 minutos), usarlo
    if (!forceRefresh && cached && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      const fiveMinutes = 5 * 60 * 1000;

      if (age < fiveMinutes) {
        console.log("[LeaderboardCache] Usando leaderboard desde localStorage");
        setCachedLeaderboard(JSON.parse(cached));
        setIsLoaded(true);
        // Si tenemos userId, obtener información actualizada del servidor
        if (userId) {
          return await loadLeaderboard(userId);
        }
        return { leaderboard: JSON.parse(cached), userInfo: null };
      }
    }

    // Si no hay caché o es viejo, cargar desde API
    return await loadLeaderboard(userId);
  };

  // Actualizar userInfo cuando se recibe del POST
  const updateUserInfo = (
    newUserInfo: UserInfo | null,
    newLeaderboard?: LeaderboardEntry[]
  ) => {
    console.log("[LeaderboardCache] Actualizando userInfo:", newUserInfo);
    setUserInfo(newUserInfo);

    // Guardar userInfo en localStorage
    if (newUserInfo) {
      localStorage.setItem("cached-userinfo", JSON.stringify(newUserInfo));
    } else {
      localStorage.removeItem("cached-userinfo");
    }

    // Si también se proporciona el leaderboard, actualizarlo
    if (newLeaderboard) {
      setCachedLeaderboard(newLeaderboard);
      localStorage.setItem(
        "cached-leaderboard",
        JSON.stringify(newLeaderboard)
      );
      localStorage.setItem("leaderboard-timestamp", Date.now().toString());
    }
  };

  // Cargar userInfo desde localStorage al montar
  useEffect(() => {
    const cachedUserInfo = localStorage.getItem("cached-userinfo");
    if (cachedUserInfo) {
      try {
        setUserInfo(JSON.parse(cachedUserInfo));
      } catch (error) {
        console.error(
          "[LeaderboardCache] Error cargando userInfo desde localStorage:",
          error
        );
      }
    }
  }, []);

  // Precargar leaderboard al montar el hook
  useEffect(() => {
    getLeaderboard();
  }, []);

  return {
    cachedLeaderboard,
    userInfo,
    isLoaded,
    loadLeaderboard,
    getLeaderboard,
    updateUserInfo,
  };
};
