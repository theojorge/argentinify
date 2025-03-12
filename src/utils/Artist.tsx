import { Artist } from "./Types";

export const getArtistList = async (): Promise<Array<Artist>> => {
  try {
    const response = await fetch("http://localhost:5000/api/artists");

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const artists = await response.json();
    console.log(artists);
    return artists;
  } catch (error) {
    console.error("Error fetching artists:", error);
    return []; // Retornar array vacío en caso de error
  }
};
