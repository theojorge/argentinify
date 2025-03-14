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
