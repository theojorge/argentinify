/* eslint-disable @typescript-eslint/no-empty-function */

import { useState, createContext, useMemo } from "react";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Lost from "./pages/Lost";
import { GameContextType } from "./utils/Types";

export const GameContext = createContext<GameContextType>({
  hasGameStarted: false,
  setHasGameStarted: () => {},
  hasUserLost: false,
  setHasUserLost: () => {},
  score: 0,
  setScore: () => {},
  isButtonVisible: true,
  setIsButtonVisible: () => {},
});

const App = () => {
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
  const [hasUserLost, setHasUserLost] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isButtonVisible, setIsButtonVisible] = useState<boolean>(true);

  const contextValue = useMemo(() => {
    return {
      hasGameStarted,
      setHasGameStarted,
      hasUserLost,
      setHasUserLost,
      score,
      setScore,
      isButtonVisible,
      setIsButtonVisible,
    };
  }, [hasGameStarted, hasUserLost, score, isButtonVisible]);

  return (
    <GameContext.Provider value={contextValue}>
      {!hasGameStarted ? <Home /> : hasUserLost ? <Lost /> : <Game />}
    </GameContext.Provider>
  );
};

export default App;
