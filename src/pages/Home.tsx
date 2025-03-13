import { BsSpotify } from "react-icons/bs";
import { AiOutlineArrowRight } from "react-icons/ai";
import { GameContext } from "@/App";
import { useContext, useEffect } from "react";
import { getArtistList } from "@/utils/Artist";

const Home = () => {
  const { setHasGameStarted, setAllArtists, setUnusedArtists } =
    useContext(GameContext);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        console.log("Iniciando carga de artistas...");
        const artists = await getArtistList();
        console.log("Artistas obtenidos:", artists?.length);
        if (artists && artists.length > 0) {
          // Mezclar el array de artistas
          const shuffledArtists = [...artists].sort(() => Math.random() - 0.5);
          console.log("Artistas mezclados:", shuffledArtists.length);
          setAllArtists(shuffledArtists);
          setUnusedArtists(shuffledArtists);
        }
      } catch (error) {
        console.error("Error loading artists:", error);
      }
    };
    loadArtists();
  }, [setAllArtists, setUnusedArtists]);

  const handleStart = () => {
    setHasGameStarted(true);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-800 p-8 text-center text-white">
      <BsSpotify className="m-8 scale-100 transform text-9xl text-[#1fdf64] transition duration-200 hover:scale-105" />
      <h1 className="text-3xl font-bold">
        Que artista tiene más oyentes en Spotify?
      </h1>
      <p className="text-xl">
        Un juego simple de más o menos basado en los oyentes de Spotify de solo
        artistas argentinos.
      </p>
      <p className="text-xl">Todos los datos son actualizados cada mes.</p>
      <button
        type="button"
        className="m-5 w-full max-w-[10rem] transform cursor-pointer rounded-full bg-blue-500 py-2 text-lg font-bold transition duration-200 hover:scale-105 hover:bg-blue-600"
        onClick={handleStart}
      >
        <div className="flex items-center justify-center">
          Empezar &nbsp; <AiOutlineArrowRight />
        </div>
      </button>
    </div>
  );
};

export default Home;
