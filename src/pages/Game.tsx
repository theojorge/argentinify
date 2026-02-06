import { Artist } from "@/utils/Types";
import CurrentScore from "@/components/CurrentScore";
import HighScore from "@/components/HighScore";
import LeftArtist from "@/components/LeftArtist";
import RightArtist from "@/components/RightArtist";
import { useState, useEffect, useContext } from "react";
import { GameContext } from "@/App";
import React from "react";
import { getRandomArtist } from "@/utils/Artist";
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
      // Llamar a la API para comparar los listeners
      const response = await fetch("/api/artists/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotifyId: rightArtist.spotifyId,
          number: parseInt(leftArtist.listeners),
          isHigher: guess,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error en la comparación");
      }

      const { listeners, isCorrect } = result;

      // Actualizar rightArtist con los listeners reales desde la API
      // Crear una copia actualizada de rightArtist con los listeners
      const updatedRightArtist = {
        ...rightArtist,
        listeners: listeners.toString(),
      };
      setIsButtonVisible(false);
      // Actualizar el estado de rightArtist
      setRightArtist(updatedRightArtist);

      if (isCorrect) {
        setScore((score) => score + 1);
        const newArtist = await fetchRandomArtist();

        setTimeout(() => {
          if (newArtist) {
            setLeftArtist(updatedRightArtist); // Mover rightArtist a la izquierda
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
        setHasUserLost(true); // Si falla la API, considera que perdió por seguridad
        setIsButtonVisible(true);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-800 text-white">
        <div className="text-2xl">Loading artists...</div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform transform select-none rounded-full bg-white p-8 text-lg font-bold shadow-sm transition duration-200 hover:scale-105">
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
