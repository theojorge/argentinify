import { Artist } from "@/utils/Types";
import CurrentScore from "@/components/CurrentScore";
import HighScore from "@/components/HighScore";
import LeftArtist from "@/components/LeftArtist";
import RightArtist from "@/components/RightArtist";
import { useState, useEffect, useContext } from "react";
import { GameContext } from "@/App";
import React from "react";

const Game = () => {
  const {
    setHasUserLost,
    score,
    setScore,
    setIsButtonVisible,
    allArtists,
    unusedArtists,
    setUnusedArtists,
  } = useContext(GameContext);

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

  // Función para obtener un número aleatorio entre min y max (inclusive)
  const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Inicializar high score
  useEffect(() => {
    if (!window.localStorage.getItem("spotify-high-score")) {
      window.localStorage.setItem("spotify-high-score", "0");
    }
  }, []);

  const getRandomArtist = () => {
    // Si no quedan artistas sin usar, reiniciar la lista
    if (unusedArtists.length === 0) {
      console.log("No hay artistas disponibles, reiniciando lista...");
      // Filtrar el artista actual de la izquierda para evitar repeticiones
      const availableArtists = allArtists.filter(
        (artist) =>
          artist.artist !== rightArtist.artist &&
          artist.artist !== leftArtist.artist
      );
      const randomIndex = getRandomNumber(1, availableArtists.length);
      const artist = availableArtists[randomIndex - 1];

      // Eliminar el artista de la lista de no usados y actualizar localStorage
      const newUnusedArtists = availableArtists.filter(
        (a) => a.artist !== artist.artist
      );
      setUnusedArtists(newUnusedArtists);
      localStorage.setItem("unused-artists", JSON.stringify(newUnusedArtists));

      return artist;
    }

    // Obtener un índice aleatorio entre 1 y el tamaño de la lista de disponibles
    const randomIndex = getRandomNumber(1, unusedArtists.length);
    const artist = unusedArtists[randomIndex - 1];

    // Eliminar el artista de la lista de no usados y actualizar localStorage
    const newUnusedArtists = unusedArtists.filter(
      (a) => a.artist !== artist.artist
    );
    setUnusedArtists(newUnusedArtists);
    localStorage.setItem("unused-artists", JSON.stringify(newUnusedArtists));

    return artist;
  };

  // Inicializar artistas
  useEffect(() => {
    if (unusedArtists.length <= 1 && loading) {
      console.log("No hay artistas disponibles, reiniciando lista...");
      setUnusedArtists([...allArtists]);
      localStorage.setItem("unused-artists", JSON.stringify([...allArtists]));
    }
    if (unusedArtists.length > 1 && loading) {
      // Mezclar el array de artistas disponibles
      const shuffledArtists = [...unusedArtists].sort(
        () => Math.random() - 0.5
      );

      // Seleccionar el primer artista
      const firstIndex = getRandomNumber(1, shuffledArtists.length);
      const firstArtist = shuffledArtists[firstIndex - 1];

      // Seleccionar el segundo artista (que no sea el mismo)
      let secondIndex;
      do {
        secondIndex = getRandomNumber(1, shuffledArtists.length);
      } while (secondIndex === firstIndex);
      const secondArtist = shuffledArtists[secondIndex - 1];

      // Actualizar la lista de artistas no usados
      const newUnusedArtists = shuffledArtists.filter(
        (artist) =>
          artist.artist !== firstArtist.artist &&
          artist.artist !== secondArtist.artist
      );
      setUnusedArtists(newUnusedArtists);
      localStorage.setItem("unused-artists", JSON.stringify(newUnusedArtists));

      setLeftArtist(firstArtist);
      setRightArtist(secondArtist);
      setLoading(false);
    }
  }, [unusedArtists, loading]);

  // Actualizar high score
  useEffect(() => {
    const storedHighScore =
      Number(window.localStorage.getItem("spotify-high-score")) || 0;

    if (score > storedHighScore) {
      window.localStorage.setItem("spotify-high-score", score.toString());
      setHighScore(score);
    }
  }, [score]);

  const answer =
    parseInt(leftArtist.listeners) < parseInt(rightArtist.listeners);

  const guessAnswer = (guess: boolean) => {
    setIsButtonVisible(false);

    const win =
      answer === guess ||
      parseInt(leftArtist.listeners) === parseInt(rightArtist.listeners);

    if (win) {
      setScore((score) => score + 1);
      setTimeout(() => {
        setLeftArtist(rightArtist);
        setRightArtist(getRandomArtist());
        setIsButtonVisible(true);
      }, 2000);
    } else {
      // Mostrar los números por 2 segundos antes de redirigir a Lost
      setTimeout(() => {
        setHasUserLost(true);
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
