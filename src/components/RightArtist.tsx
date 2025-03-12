import { GuessArtist } from "@/utils/Types";
import { AiOutlineArrowUp, AiOutlineArrowDown } from "react-icons/ai";
import { useContext } from "react";
import { Listeners } from "./Listeners";
import { GameContext } from "@/App";

const RightArtist = (props: GuessArtist) => {
  const { artist, image_url, listeners, guessAnswer } = props;

  const { isButtonVisible } = useContext(GameContext);

  return (
    <div
      className="cover flex h-full w-full flex-col items-center justify-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${image_url})`,
      }}
    >
      <h1 className="mt-4 px-4 text-center text-3xl font-bold text-white drop-shadow-md">
        &quot;{artist}&quot;
      </h1>

      <p className="m-4 text-center text-sm text-white drop-shadow-md">tiene</p>

      {isButtonVisible && (
        <>
          <button
            type="button"
            className="m-1 mt-4 w-full max-w-[10rem] transform cursor-pointer rounded-full bg-[#59ac51] py-2 text-lg font-bold text-white drop-shadow-md transition duration-200 hover:scale-105 hover:bg-[#3e7938]"
            onClick={() => guessAnswer(true)}
          >
            <div className="flex items-center justify-center">
              Más &nbsp; <AiOutlineArrowUp />
            </div>
          </button>

          <button
            type="button"
            className="m-1 w-full max-w-[10rem] transform cursor-pointer rounded-full bg-[#c75555] py-2 text-lg font-bold text-white drop-shadow-md transition duration-200 hover:scale-105 hover:bg-[#933f3f]"
            onClick={() => guessAnswer(false)}
          >
            <div className="flex items-center justify-center">
              Menos &nbsp; <AiOutlineArrowDown />
            </div>
          </button>
        </>
      )}

      {!isButtonVisible && <Listeners listeners={parseInt(listeners)} />}

      <p className="mt-2 text-center text-sm text-white drop-shadow-md">
        oyentes mensuales
      </p>
    </div>
  );
};

export default RightArtist;
