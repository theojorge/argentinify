import { GameContext } from "@/App";
import { useContext } from "react";
import { AiOutlineArrowRight } from "react-icons/ai";

const Lost = () => {
  const { setHasUserLost, setHasGameStarted, score, setScore } =
    useContext(GameContext);

  const resetGame = () => {
    setScore(0);
    setHasUserLost(false);
    setHasGameStarted(true);
  };

  return (
    <div 
      className="flex h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat p-8 text-center text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/lost-background.jpg')`
      }}
    >
      <div className="rounded-lg bg-black/50 p-8 backdrop-blur-sm">
        <h1 className="text-5xl font-bold text-red-500">¡Perdiste!</h1>
        <h1 className="mt-8 text-3xl font-bold">Tu puntaje final fue <span className="text-green-400">{score}</span></h1>
        <button
          type="button"
          className="m-8 w-full max-w-[12rem] transform cursor-pointer rounded-full bg-blue-500 py-3 text-lg font-bold transition duration-200 hover:scale-105 hover:bg-blue-600"
          onClick={resetGame}
        >
          <div className="flex items-center justify-center">
            Jugar de nuevo &nbsp; <AiOutlineArrowRight />
          </div>
        </button>
      </div>
      <div className="mt-8 text-center">
        <img 
          src="https://http2.mlstatic.com/D_NQ_NP_774991-MLA74959264979_032024-F.jpg" 
          alt="Mercado Pago Logo" 
          className="mx-auto mb-2 h-12 w-auto"
        />
        <p className="text-lg">
          Alias MP: <span className="font-mono font-bold text-blue-400">THEOJORGE</span>
        </p>
      </div>
    </div>
  );
};

export default Lost;
