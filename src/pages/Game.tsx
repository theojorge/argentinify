import { getArtistList } from "@/utils/Artist";
import { Artist } from "@/utils/Types";
import CurrentScore from "@/components/CurrentScore";
import HighScore from "@/components/HighScore";
import LeftArtist from "@/components/LeftArtist";
import RightArtist from "@/components/RightArtist";
import { useState, useEffect, useContext } from "react";
import { GameContext } from "@/App";
import React from "react";

const Game = () => {
  const { setHasUserLost, score, setScore, setIsButtonVisible } =
    useContext(GameContext);

  const [loading, setLoading] = useState(true);
  const [artistList, setArtistList] = useState<Artist[]>([]);
  const [usedArtists, setUsedArtists] = useState<Set<string>>(() => {
    // Recuperar artistas usados del localStorage
    const saved = localStorage.getItem('used-artists');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
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
    if (artistList.length === 0) {
      return {
        artist: 'Loading...',
        listeners: '0',
        image_url: '',
      };
    }

    // Filtrar artistas no usados
    const availableArtists = artistList.filter(
      (artist) => !usedArtists.has(artist.artist),
    );

    // Si no quedan artistas disponibles, reiniciar la lista de usados
    if (availableArtists.length === 0) {
      setUsedArtists(new Set());
      localStorage.setItem('used-artists', JSON.stringify([]));
      return artistList[getRandomNumber(1, artistList.length) - 1]; // Seleccionar de la lista completa
    }

    // Obtener un índice aleatorio entre 1 y el tamaño de la lista de disponibles
    const randomIndex = getRandomNumber(1, availableArtists.length);
    const artist = availableArtists[randomIndex - 1];

    // Actualizar la lista de artistas usados en estado y localStorage
    const newUsedArtists = new Set([...usedArtists, artist.artist]);
    setUsedArtists(newUsedArtists);
    localStorage.setItem('used-artists', JSON.stringify([...newUsedArtists]));

    return artist;
  };

  // Cargar artistas inicialmente
  useEffect(() => {
    const loadArtists = async () => {
      try {
        const artists = await getArtistList();
        if (artists && artists.length > 0) {
          // Mezclar el array de artistas
          const shuffledArtists = [...artists].sort(() => Math.random() - 0.5);
          setArtistList(shuffledArtists);

          // Filtrar artistas no usados
          const availableArtists = shuffledArtists.filter(
            (artist) => !usedArtists.has(artist.artist),
          );

          // Si no hay artistas disponibles, reiniciar la lista
          if (availableArtists.length === 0) {
            setUsedArtists(new Set());
            localStorage.setItem('used-artists', JSON.stringify([]));
            // Usar la lista completa mezclada
            const firstIndex = getRandomNumber(1, shuffledArtists.length);
            const firstArtist = shuffledArtists[firstIndex - 1];

            let secondIndex;
            do {
              secondIndex = getRandomNumber(1, shuffledArtists.length);
            } while (secondIndex === firstIndex);

            const secondArtist = shuffledArtists[secondIndex - 1];

            // Actualizar la lista de artistas usados con los dos primeros
            const newUsedArtists = new Set([firstArtist.artist, secondArtist.artist]);
            setUsedArtists(newUsedArtists);
            localStorage.setItem('used-artists', JSON.stringify([...newUsedArtists]));

            setLeftArtist(firstArtist);
            setRightArtist(secondArtist);
          } else {
            // Usar artistas disponibles
            const firstIndex = getRandomNumber(1, availableArtists.length);
            const firstArtist = availableArtists[firstIndex - 1];

            let secondIndex;
            do {
              secondIndex = getRandomNumber(1, availableArtists.length);
            } while (secondIndex === firstIndex);

            const secondArtist = availableArtists[secondIndex - 1];

            // Actualizar la lista de artistas usados
            const newUsedArtists = new Set([
              ...usedArtists,
              firstArtist.artist,
              secondArtist.artist,
            ]);
            setUsedArtists(newUsedArtists);
            localStorage.setItem('used-artists', JSON.stringify([...newUsedArtists]));

            setLeftArtist(firstArtist);
            setRightArtist(secondArtist);
          }
        }
      } catch (error) {
        console.error('Error loading artists:', error);
      } finally {
        setLoading(false);
      }
    };
    loadArtists();
  }, []);

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