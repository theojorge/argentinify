import { useState, useEffect } from "react";

export const useUserId = () => {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const generateAndSetUserId = () => {
      // Intentar obtener el userId existente del localStorage
      let storedUserId = localStorage.getItem("user-id");

      if (!storedUserId) {
        // Generar un nuevo ID único si no existe
        const newUserId = generateUniqueId();
        localStorage.setItem("user-id", newUserId);
        storedUserId = newUserId;
        console.log(`[UserId] Nuevo ID generado: ${newUserId}`);
      } else {
        console.log(`[UserId] ID existente recuperado: ${storedUserId}`);
      }

      setUserId(storedUserId);
      return storedUserId;
    };

    // Generar ID inicial
    generateAndSetUserId();

    // Escuchar cambios en localStorage (para detectar si se borra durante el juego)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user-id") {
        if (!e.newValue) {
          // Si se borra el user-id, generar uno nuevo
          console.log("[UserId] user-id fue borrado, regenerando...");
          generateAndSetUserId();
        }
      }
    };

    // También verificar periódicamente si localStorage fue modificado
    const intervalCheck = setInterval(() => {
      const currentUserId = localStorage.getItem("user-id");
      if (!currentUserId && userId) {
        console.log(
          "[UserId] Detectado borrado de localStorage, regenerando ID..."
        );
        generateAndSetUserId();
      }
    }, 1000); // Verificar cada segundo

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalCheck);
    };
  }, [userId]);

  return userId;
};

// Función para generar un ID único
const generateUniqueId = (): string => {
  // Combinar timestamp + random string para garantizar unicidad
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomString}`;
};
