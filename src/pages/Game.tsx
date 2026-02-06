import { Artist } from "@/utils/Types";
import CurrentScore from "@/components/CurrentScore";
import HighScore from "@/components/HighScore";
import LeftArtist from "@/components/LeftArtist";
import RightArtist from "@/components/RightArtist";
import { useState, useEffect, useContext } from "react";
import { GameContext } from "@/App";
import React from "react";
import { useInitialArtists } from "@/hooks/useInitialArtists";

const Game = () => {
  const {
    setHasUserLost,
    score,
    setScore,
    setIsButtonVisible,
    InitialRightArtist,
    InitialLeftArtist,
  } = useContext(GameContext);
  const { fetchRandomArtist } = useInitialArtists();
  const [loading, setLoading] = useState(true);
  const [leftArtist, setLeftArtist] = useState<Artist>({
    artist: "Loading...",
    listeners: "0",
    image_url: "",
  });
  const [rightArtist, setRightArtist] = useState<Artist>({
    artist: "Loading...",
    listeners: "0",
    image_url: "",
  });

  const [highScore, setHighScore] = useState<number>(
    Number(window.localStorage.getItem("spotify-high-score")) || 0
  );

  useEffect(() => {
    if (InitialLeftArtist && InitialRightArtist) {
      setLeftArtist(InitialLeftArtist);
      setRightArtist(InitialRightArtist);
      setLoading(false);
    } else {
      // En caso de que no estén cargados, podrías redirigir a Home o mostrar error
      console.warn("Artistas iniciales no disponibles");
    }
  }, [InitialLeftArtist, InitialRightArtist]);

  // Inicializar high score
  useEffect(() => {
    if (!window.localStorage.getItem("spotify-high-score")) {
      window.localStorage.setItem("spotify-high-score", "0");
    }
  }, []);

  // Actualizar high score
  useEffect(() => {
    const storedHighScore =
      Number(window.localStorage.getItem("spotify-high-score")) || 0;

    if (score > storedHighScore) {
      window.localStorage.setItem("best-score", score.toString());
      window.localStorage.setItem("spotify-high-score", score.toString());
      setHighScore(score);
    }
  }, [score]);

  // Actualizar high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score]);

  const guessAnswer = async (guess: boolean) => {
    try {
      // Obtener los listeners del artista de la derecha
      const response = await fetch("/api/artists/listeners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotifyId: rightArtist.spotifyId,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener los listeners");
      }

      const { listeners } = await response.json();

      // Actualizar rightArtist con los listeners reales
      const updatedRightArtist = {
        ...rightArtist,
        listeners: listeners.toString(),
      };

      setRightArtist(updatedRightArtist);
      setIsButtonVisible(false);

      const rightListeners = listeners;
      const leftListeners = parseInt(leftArtist.listeners);

      // Comparación
      const isCorrect = guess
        ? rightListeners > leftListeners
        : rightListeners < leftListeners;

      if (isCorrect) {
        setScore((score) => score + 1);

        // Obtener el siguiente artista
        const newArtist = await fetchRandomArtist();

        setTimeout(() => {
          if (newArtist) {
            setLeftArtist(updatedRightArtist); // Mover rightArtist actualizado a la izquierda
            setRightArtist(newArtist); // Nuevo artista a la derecha
          }
          setIsButtonVisible(true);
        }, 2000);
      } else {
        setTimeout(() => {
          setHasUserLost(true);
          setIsButtonVisible(true);
        }, 2000);
      }
    } catch (error) {
      console.error("Error al procesar la respuesta:", error);
      setTimeout(() => {
        setHasUserLost(true);
        setIsButtonVisible(true);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-800 text-white">
        <div className="text-2xl">
          Artistas llegando, no hubo presupuesto para un telonero...
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform select-none rounded-full bg-white p-8 text-lg font-bold shadow-sm transition duration-200 hover:scale-105">
        VS
      </div>
      <div className="grid h-screen w-screen grid-rows-2 bg-gray-800 md:grid-cols-2">
        <div className="h-full w-full md:h-screen">
          <LeftArtist
            artist={leftArtist.artist}
            listeners={leftArtist.listeners}
            image_url={leftArtist.image_url}
          />
        </div>
        <div className="h-full w-full md:h-screen">
          <RightArtist
            artist={rightArtist.artist}
            listeners={rightArtist.listeners}
            image_url={rightArtist.image_url}
            guessAnswer={guessAnswer}
          />
        </div>

        <HighScore score={highScore} />
        <CurrentScore score={score} />
      </div>
    </React.Fragment>
  );
};

export default Game;
