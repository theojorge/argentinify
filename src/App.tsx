/* eslint-disable @typescript-eslint/no-empty-function */

import { useState, createContext, useMemo } from "react";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Lost from "./pages/Lost";
import { GameContextType, Artist } from "./utils/Types";

export const GameContext = createContext<GameContextType>({
  hasGameStarted: false,
  setHasGameStarted: () => {},
  hasUserLost: false,
  setHasUserLost: () => {},
  score: 0,
  setScore: () => {},
  isButtonVisible: true,
  setIsButtonVisible: () => {},
  allArtists: [],
  setAllArtists: () => {},
  unusedArtists: [],
  setUnusedArtists: () => {},
});

const App = () => {
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
  const [hasUserLost, setHasUserLost] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isButtonVisible, setIsButtonVisible] = useState<boolean>(true);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [unusedArtists, setUnusedArtists] = useState<Artist[]>([]);

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
      allArtists,
      setAllArtists,
      unusedArtists,
      setUnusedArtists,
    };
  }, [
    hasGameStarted,
    hasUserLost,
    score,
    isButtonVisible,
    allArtists,
    unusedArtists,
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {!hasGameStarted ? <Home /> : hasUserLost ? <Lost /> : <Game />}
    </GameContext.Provider>
  );
};

export default App;
