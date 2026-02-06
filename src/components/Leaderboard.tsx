import { useEffect, useState } from "react";
import mongoose from "mongoose";

// Definir el esquema y modelo para el leaderboard
const leaderboardSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  score: { type: Number, required: true },
});

const LeaderboardModel = mongoose.model("Leaderboard", leaderboardSchema);

// Interfaz para el documento de Mongoose
interface LeaderboardDocument extends mongoose.Document {
  userId: number;
  username: string;
  score: number;
}

// Interfaz para el estado del componente
interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
}

interface LeaderboardProps {
  userId: string;
  currentScore: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ userId, currentScore }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [username, setUsername] = useState("");
  const [showUsernameInput, setShowUsernameInput] = useState(false);

  const styles = {
    container: {
      padding: "20px",
      maxWidth: "500px",
      margin: "0 auto",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      borderRadius: "10px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    title: {
      textAlign: "center" as const,
      color: "#fff",
      fontSize: "24px",
      marginBottom: "20px",
      fontWeight: "bold",
    },
    list: {
      listStyle: "none",
      padding: 0,
    },
    listItem: {
      display: "flex",
      justifyContent: "space-between",
      padding: "12px",
      marginBottom: "8px",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: "8px",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      color: "#fff",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        transform: "translateX(5px)",
      },
    },
    inputContainer: {
      marginTop: "20px",
      textAlign: "center" as const,
    },
    input: {
      padding: "10px",
      fontSize: "16px",
      borderRadius: "8px",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      marginRight: "10px",
      width: "200px",
      color: "#fff",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      "&:focus": {
        outline: "none",
        borderColor: "rgba(255, 255, 255, 0.4)",
      },
    },
    button: {
      padding: "10px 20px",
      fontSize: "16px",
      marginTop: "20px",
      backgroundColor: "#3b82f6",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      opacity: username ? 1 : 0.5,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "#2563eb",
        transform: "translateY(-2px)",
      },
    },
    message: {
      color: "#4ade80",
      fontWeight: "bold",
      marginBottom: "10px",
    },
  };

  // Cargar los puntajes del leaderboard desde la DB al montar
  // Cargar los puntajes del leaderboard desde la API al montar
  useEffect(() => {
    const fetchScores = async () => {
      console.log("[Leaderboard] Iniciando fetchScores desde la API...");
      try {
        const response = await fetch("/api/leaderboard"); // Ajusta la URL según tu backend
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const scoresCollection: LeaderboardEntry[] = await response.json();
        console.log(
          `[Leaderboard] Puntajes obtenidos de la API: ${scoresCollection.length} entradas`
        );
        scoresCollection.forEach((entry) => {
          console.log(
            `[Leaderboard] Entrada: ${entry.username} - ${entry.score}`
          );
        });
        setScores(scoresCollection);
        console.log("[Leaderboard] Scores actualizados en el estado");
      } catch (error) {
        console.error("[Leaderboard] Error en fetchScores:", error);
      }
    };
    fetchScores();
  }, []);

  // Verificar si currentScore supera highScore y mostrar el input
  useEffect(() => {
    const highScore = localStorage.getItem("best-score");
    if (highScore) {
      console.log(
        `[Leaderboard] HighScore cargado desde localStorage: ${highScore}`
      );
    } else {
      console.log("[Leaderboard] No se encontró highScore en localStorage");
      return;
    }
    console.log(
      `[Leaderboard] Verificando puntaje - currentScore: ${currentScore}, highScore: ${highScore}`
    );
    console.log("[Leaderboard] Nuevo highScore detectado, mostrando input");
    setShowUsernameInput(true);
    localStorage.removeItem("best-score");
    console.log(
      `[Leaderboard] HighScore actualizado a ${currentScore} y guardado en localStorage`
    );
  }, [currentScore]);

  // Actualizar o crear la entrada en la DB a través de la API
  const updateScore = async () => {
    if (!username) {
      console.log("[Leaderboard] Username vacío, no se actualiza la DB");
      return;
    }

    console.log(
      `[Leaderboard] Iniciando updateScore para userId: ${userId}, username: ${username}, score: ${currentScore}`
    );
    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, username, score: currentScore }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedScores: LeaderboardEntry[] = await response.json();
      console.log("[Leaderboard] Puntajes actualizados recibidos de la API");
      updatedScores.forEach((entry) => {
        console.log(
          `[Leaderboard] Entrada actualizada: ${entry.username} - ${entry.score}`
        );
      });
      setScores(updatedScores);
      setShowUsernameInput(false);
      setUsername("");
      console.log(
        "[Leaderboard] Scores actualizados, input ocultado y username limpiado"
      );
    } catch (error) {
      console.error("[Leaderboard] Error en updateScore:", error);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    console.log(`[Leaderboard] Username cambiado a: ${e.target.value}`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Leaderboard</h2>
      {/* Mostrar siempre el leaderboard */}
      <ul style={styles.list}>
        {scores.map((score) => (
          <li key={score.userId} style={styles.listItem}>
            <span>{score.username}</span>
            <span>{score.score}</span>
          </li>
        ))}
      </ul>

      {/* Mostrar input solo si currentScore > highScore */}
      {showUsernameInput && (
        <div style={styles.inputContainer}>
          <p style={styles.message}>¡Nuevo puntaje alto! Ingresa tu nombre:</p>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Tu nombre"
            style={styles.input}
          />
          <button
            onClick={updateScore}
            disabled={!username}
            style={styles.button}
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
