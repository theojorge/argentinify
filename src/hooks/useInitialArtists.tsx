import { useState, useEffect, useContext } from "react";
import { getRandomArtist } from "@/utils/Artist";
import { GameContext } from "@/App";

const MAX_USED_ARTIST_IDS = 200;

export const useInitialArtists = () => {
  const { setInitialLeftArtist, setInitialRightArtist } =
    useContext(GameContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedArtistIds, setUsedArtistIds] = useState<string[]>(() => {
    const storedIds = window.localStorage.getItem("usedArtistIds");
    return storedIds ? JSON.parse(storedIds) : [];
  });

  useEffect(() => {
    if (usedArtistIds.length > MAX_USED_ARTIST_IDS) {
      window.localStorage.removeItem("usedArtistIds");
      setUsedArtistIds([]);
    } else {
      window.localStorage.setItem(
        "usedArtistIds",
        JSON.stringify(usedArtistIds)
      );
    }
  }, [usedArtistIds]);

  const fetchRandomArtist = async (includeListeners = false) => {
    const artist = await getRandomArtist(usedArtistIds, includeListeners);
    if (artist && artist.spotifyId) {
      setUsedArtistIds((prev) =>
        artist.spotifyId ? [...prev, artist.spotifyId] : prev
      );
    }
    return artist;
  };

  const initializeArtists = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const left = await fetchRandomArtist(true);
      const right = await fetchRandomArtist(false);

      if (left && right) {
        setInitialLeftArtist(left);
        setInitialRightArtist(right);
      } else {
        setError("No se pudieron cargar los artistas iniciales");
      }
    } catch (err) {
      setError("Error al cargar los artistas iniciales");
      console.error("Error initializing artists:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, initializeArtists, fetchRandomArtist };
};
