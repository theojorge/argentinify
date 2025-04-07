import { Artist } from "./Types";

export const getArtistList = async (): Promise<Array<Artist>> => {
  try {
    const response = await fetch("/api/artists");

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const artists = await response.json();
    return artists;
  } catch (error) {
    console.error("Error fetching artists:", error);
    return []; // Retornar array vacío en caso de error
  }
};

export const getRandomArtist = async (excludeIds: string[] = [], includeListeners: boolean = false): Promise<Artist | null> => {
  try {
    const response = await fetch("/api/artists/random", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ excludeIds, includeListeners }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const artist = await response.json();
    return artist;
  } catch (error) {
    console.error("Error fetching random artist:", error);
    return null;
  }
};
