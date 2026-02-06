import { BsSpotify } from "react-icons/bs";
import { GameContext } from "@/App";
import { useContext, useEffect } from "react";
import { useInitialArtists } from "@/hooks/useInitialArtists";
import { useLeaderboardCache } from "@/hooks/useLeaderboardCache";
//import { getArtistList } from "@/utils/Artist";

const Home = () => {
  const { setHasGameStarted, userId } = useContext(GameContext);
  const { initializeArtists } = useInitialArtists();
  const { getLeaderboard } = useLeaderboardCache();

  useEffect(() => {
    initializeArtists();
    // Precargar leaderboard en segundo plano con userId
    getLeaderboard(false, userId);
  }, [userId]);

  const handleStart = async () => {
    localStorage.removeItem("best-score");
    setHasGameStarted(true);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#74ACDF] p-8 text-center">
      <div className="absolute inset-0 flex flex-col">
        <div className="h-1/4 bg-[#74ACDF]"></div>
        <div className="h-2/4 bg-white"></div>
        <div className="h-1/4 bg-[#74ACDF]"></div>
      </div>
      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="flex justify-center">
          <BsSpotify className="m-8 scale-100 transform text-9xl text-[#74ACDF] transition duration-200 hover:scale-105" />
        </div>
        <h1 className="mb-8 text-3xl font-bold text-[#002776]">
          Que artista tiene más oyentes en Spotify?
        </h1>
        <p className="text-xl text-[#002776]">
          Un juego simple de más o menos basado en los oyentes de Spotify con
          más de 250 artistas argentinos.
        </p>
        <p className="text-xl text-[#002776]">
          Todos los datos son actualizados cada semana.
        </p>
        <button
          type="button"
          className="m-5 w-full max-w-[10rem] transform cursor-pointer rounded-full bg-[#002776] py-2 text-lg font-bold text-white transition duration-200 hover:scale-105 hover:bg-[#001B4D]"
          onClick={handleStart}
        >
          <div className="flex items-center justify-center">
            Empezar &nbsp;
          </div>
        </button>
      </div>
    </div>
  );
};

export default Home;
