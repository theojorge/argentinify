/* eslint-disable @typescript-eslint/no-empty-function */

import { useState, createContext, useMemo, useEffect } from "react";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Lost from "./pages/Lost";
import { GameContextType, Artist } from "./utils/Types";
import { useUserId } from "./hooks/useUserId";

export const GameContext = createContext<GameContextType>({
  hasGameStarted: false,
  setHasGameStarted: () => {},
  hasUserLost: false,
  setHasUserLost: () => {},
  score: 0,
  setScore: () => {},
  isButtonVisible: true,
  setIsButtonVisible: () => {},
  InitialRightArtist: null,
  setInitialRightArtist: () => {},
  InitialLeftArtist: null,
  setInitialLeftArtist: () => {},
  userId: "",
  setUserId: (id: string) => {},
});

const App = () => {
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
  const [hasUserLost, setHasUserLost] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isButtonVisible, setIsButtonVisible] = useState<boolean>(true);
  const [InitialRightArtist, setInitialRightArtist] = useState<Artist | null>(
    null
  );
  const [InitialLeftArtist, setInitialLeftArtist] = useState<Artist | null>(
    null
  );
  const userId = useUserId();
  const [setUserId] = useState(() => (id: string) => {
    console.log(`[App] UserId actualizado: ${id}`);
  });

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
      InitialRightArtist,
      setInitialRightArtist,
      InitialLeftArtist,
      setInitialLeftArtist,
      userId,
      setUserId,
    };
  }, [
    hasGameStarted,
    hasUserLost,
    score,
    isButtonVisible,
    InitialRightArtist,
    InitialLeftArtist,
    userId,
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {!hasGameStarted ? <Home /> : hasUserLost ? <Lost /> : <Game />}
    </GameContext.Provider>
  );
};

export default App;
