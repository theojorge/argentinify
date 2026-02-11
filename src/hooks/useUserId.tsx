import { useState, useEffect } from "react";

export const useUserId = () => {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const generateAndSetUserId = () => {
      // Intentar obtener el userId existente del localStorage
      let storedUserId = window.localStorage.getItem("user-id");

      if (!storedUserId) {
        // Generar un nuevo ID único si no existe
        const newUserId = generateUniqueId();
        window.localStorage.setItem("user-id", newUserId);
        storedUserId = newUserId;
        console.log(`[UserId] Nuevo ID generado: ${newUserId}`);
      } else {
        console.log(`[UserId] ID existente recuperado: ${storedUserId}`);
      }

      setUserId(storedUserId);
      return storedUserId;
    };

    generateAndSetUserId();
  }, []);

  return userId;
};

// Función para generar un ID único
const generateUniqueId = (): string => {
  // Combinar timestamp + random string para garantizar unicidad
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomString}`;
};
