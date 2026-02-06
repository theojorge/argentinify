import { GameContext } from "@/App";
import { useContext, useEffect } from "react";
import { AiOutlineArrowRight } from "react-icons/ai";
import Leaderboard from "@/components/Leaderboard";
import { useInitialArtists } from "@/hooks/useInitialArtists";

const Lost = () => {
  const { setHasUserLost, setHasGameStarted, score, setScore, userId } =
    useContext(GameContext);
  const { initializeArtists } = useInitialArtists();

  useEffect(() => {
    initializeArtists();
  }, []);

  const resetGame = async () => {
    setScore(0);
    setHasUserLost(false);
    setHasGameStarted(true);
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat p-4 sm:p-8"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/lost-background.jpg')`,
      }}
    >
      {/* Contenedor principal para centrar el cartón */}
      <div className="flex w-full max-w-6xl flex-col items-center gap-6">
        {/* Cartón central */}
        <div className="w-full max-w-md rounded-xl bg-black/60 p-8 text-center shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-xl">
          <h1 className="text-4xl font-bold text-red-500 sm:text-5xl">
            ¡Perdiste!
          </h1>
          <h2 className="mt-6 text-2xl font-semibold text-white sm:text-3xl">
            Tu puntaje final fue <span className="text-green-400">{score}</span>
          </h2>

          <button
            type="button"
            className="mt-8 w-full max-w-[12rem] transform rounded-full bg-gradient-to-r from-blue-500 to-blue-700 py-3 text-lg font-bold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-blue-800"
            onClick={resetGame}
          >
            <div className="flex items-center justify-center gap-2">
              Jugar de nuevo
            </div>
          </button>
        </div>

        <div className="mt-6 w-full max-w-xs">
          <Leaderboard userId={userId} currentScore={score} />
        </div>
      </div>

      {/* Footer con Alias MP */}
      <div className="absolute bottom-4 flex flex-col items-center text-center">
        <img
          src="https://http2.mlstatic.com/D_NQ_NP_774991-MLA74959264979_032024-F.jpg"
          alt="Mercado Pago Logo"
          className="mb-2 h-10 w-auto transition-transform duration-300 hover:scale-110"
        />
        <p className="text-base text-gray-200 sm:text-lg">
          Alias MP:{" "}
          <span className="font-mono font-bold text-blue-400 transition-colors duration-300 hover:text-blue-300">
            THEOJORGE
          </span>
        </p>
      </div>
    </div>
  );
};

export default Lost;
