import { useEffect, useState } from "react";
import { useLeaderboardCache } from "@/hooks/useLeaderboardCache";
import { useContext } from "react";
import { GameContext } from "@/App";

interface LeaderboardEntry {
    userId: string;
    username: string;
    score: number;
}

interface LeaderboardProps {
    currentScore: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentScore }) => {
    const { userId } = useContext(GameContext);
    const { cachedLeaderboard, userInfo, getLeaderboard, loadLeaderboard, updateUserInfo } = useLeaderboardCache();
    const [username, setUsername] = useState("");
    const [showUsernameInput, setShowUsernameInput] = useState(false);
    const [showRecommendationForm, setShowRecommendationForm] = useState(false);
    const [artistRecommendation, setArtistRecommendation] = useState("");
    const [recommendationMessage, setRecommendationMessage] = useState("");
    const [showRecommend, setshowRecommend] = useState(false);


    const styles = {
        container: {
            padding: "20px",
            maxWidth: "500px",
            margin: "0 auto",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(8px)",
        },
        title: {
            fontSize: "24px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center" as const,
            marginBottom: "20px",
        },
        list: {
            listStyle: "none",
            padding: 0,
            margin: 0,
        },
        listItem: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 15px",
            margin: "5px 0",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "5px",
            color: "white",
        },
        inputContainer: {
            marginTop: "20px",
            textAlign: "center" as const,
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            gap: "15px",
        },
        message: {
            color: "#4ade80",
            fontSize: "16px",
            marginBottom: "0px",
        },
        inputWrapper: {
            display: "flex",
            gap: "10px",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap" as const,
        },
        input: {
            padding: "10px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            width: "200px",
        },
        button: {
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
                backgroundColor: "#2563eb",
            },
        },
        recommendationContainer: {
            marginTop: "20px",
            padding: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            textAlign: "center" as const,
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            gap: "15px",
        },
        recommendationTitle: {
            color: "#f59e0b",
            fontSize: "18px",
            marginBottom: "0px",
            fontWeight: "bold",
            lineHeight: "1.4",
        },
        recommendationForm: {
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            gap: "12px",
            width: "100%",
        },
        recommendationInputWrapper: {
            display: "flex",
            gap: "10px",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap" as const,
            width: "100%",
        },
        recommendationInput: {
            padding: "10px",
            fontSize: "14px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            width: "200px",
        },
        buttonGroup: {
            display: "flex",
            gap: "10px",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap" as const,
        },
        successMessage: {
            color: "#4ade80",
            fontSize: "14px",
            marginTop: "8px",
        },
        positionMessage: {
            color: "#f59e0b",
            fontWeight: "bold",
            marginBottom: "10px",
            textAlign: "center" as const,
            fontSize: "16px",
        },
    };


    // Cargar el username existente del usuario cuando se actualiza userInfo o leaderboard
    useEffect(() => {
        // Priorizar userInfo 
        if (userInfo && userInfo.username) {
            setUsername(userInfo.username);
        } else if (cachedLeaderboard.length > 0 && userId) {
            // Fallback: buscar en leaderboard si userInfo no está disponible
            const userEntry = cachedLeaderboard.find(score => score.userId === userId);
            if (userEntry && userEntry.username) {
                setUsername(userEntry.username);
            }
        }
    }, [cachedLeaderboard, userId, userInfo]);

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

        // Cargar el username existente del usuario desde userInfo 
        if (userInfo && userInfo.username) {
            setUsername(userInfo.username);
            console.log(`[Leaderboard] Username existente cargado desde userInfo: ${userInfo.username}`);
        }

        setShowUsernameInput(true);
        localStorage.removeItem("best-score");
        console.log(
            `[Leaderboard] HighScore actualizado a ${currentScore} y guardado en localStorage`
        );
    }, [currentScore, userInfo]);

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

            const updatedScores = await response.json();
            console.log("[Leaderboard] Puntajes actualizados recibidos de la API");
            updatedScores.leaderboard.forEach((entry: LeaderboardEntry) => {
                console.log(
                    `[Leaderboard] Entrada actualizada: ${entry.username} - ${entry.score}`
                );
            });

            // Actualizar el leaderboard y userInfo en el hook
            updateUserInfo(updatedScores.userInfo, updatedScores.leaderboard);

            // Verificar si está en top 10 basado en userInfo recibido del servidor
            const userInTop10 = updatedScores.userInfo?.isInTop10 ?? false;

            setShowUsernameInput(false);
            setUsername("");

            // Mostrar recomendación si está en top 10 y puede recomendar
            if (userInTop10 && updatedScores.userInfo?.canRecommend) {
                setshowRecommend(true);
            }
            console.log(
                "[Leaderboard] Scores actualizados, input ocultado y username limpiado"
            );
        } catch (error) {
            console.error("[Leaderboard] Error en updateScore:", error);
        }
    };

    // Enviar recomendación de artista
    const submitRecommendation = async () => {
        if (!artistRecommendation.trim()) {
            console.log("[Leaderboard] Recomendación vacía, no se envía");
            return;
        }

        console.log(`[Leaderboard] Enviando recomendación: ${artistRecommendation}`);

        try {
            const response = await fetch("/api/recommendations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                    username: username || "Anónimo",
                    artistName: artistRecommendation.trim()
                }),
            });

            if (response.ok) {
                setRecommendationMessage("¡Recomendación enviada con éxito!");
                setArtistRecommendation("");
                setShowRecommendationForm(false);
                setshowRecommend(false);
                console.log("[Leaderboard] Recomendación enviada exitosamente");

                // Limpiar mensaje después de 3 segundos
                setTimeout(() => setRecommendationMessage(""), 3000);
            } else {
                const errorData = await response.json();
                setRecommendationMessage(`Error: ${errorData.error || 'Error al enviar recomendación'}`);
                console.error("[Leaderboard] Error del servidor:", errorData);
            }
        } catch (error) {
            console.error("[Leaderboard] Error al enviar recomendación:", error);
            setRecommendationMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        console.log(`[Leaderboard] Username cambiado a: ${e.target.value}`);
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Tabla de Líderes</h2>
            {/* Mostrar siempre el leaderboard */}
            <ul style={styles.list}>
                {cachedLeaderboard.map((score: LeaderboardEntry) => (
                    <li
                        key={score.userId}
                        style={{
                            ...styles.listItem,
                            ...(score.userId === userId ? {
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                border: "1px solid rgba(59, 130, 246, 0.5)",
                                fontWeight: "bold"
                            } : {})
                        }}
                    >
                        <span style={score.userId === userId ? { color: "#3b82f6" } : {}}>
                            {score.username}
                        </span>
                        <span>{score.score}</span>
                    </li>
                ))}
            </ul>

            {/* Mostrar input solo si currentScore > highScore */}
            {showUsernameInput && (
                <div style={styles.inputContainer}>
                    <p style={styles.message}>¡Nuevo puntaje alto! Ingresa tu nombre:</p>
                    <div style={styles.inputWrapper}>
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
                </div>
            )}

            {/* Mostrar posición del usuario si no está en top 10 pero tiene una posición */}
            {userInfo && !userInfo.isInTop10 && userInfo.position && !showUsernameInput && (
                <div style={styles.positionMessage}>
                    Estás en la posición #{userInfo.position} de {userInfo.totalPlayers} jugadores
                </div>
            )}

            {/* Mostrar formulario de recomendación si entraste al top 10*/}
            {showRecommend && (
                <div style={styles.recommendationContainer}>
                    <p style={styles.recommendationTitle}>
                        ¡Estás en el Top 10!<br />
                        Recomienda un artista
                    </p>
                    {!showRecommendationForm ? (
                        <button
                            onClick={() => setShowRecommendationForm(true)}
                            style={styles.button}
                        >
                            Recomendar Artista
                        </button>
                    ) : (
                        <div style={styles.recommendationForm}>
                            <div style={styles.recommendationInputWrapper}>
                                <input
                                    type="text"
                                    value={artistRecommendation}
                                    onChange={(e) => setArtistRecommendation(e.target.value)}
                                    placeholder="Nombre del artista"
                                    style={styles.recommendationInput}
                                />
                            </div>
                            <div style={styles.buttonGroup}>
                                <button
                                    onClick={submitRecommendation}
                                    disabled={!artistRecommendation.trim()}
                                    style={styles.button}
                                >
                                    Enviar
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRecommendationForm(false);
                                        setArtistRecommendation("");
                                    }}
                                    style={{ ...styles.button, backgroundColor: "#6b7280" }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                    {recommendationMessage && (
                        <p style={styles.successMessage}>{recommendationMessage}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
