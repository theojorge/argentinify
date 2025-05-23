export interface GameContextType {
  hasGameStarted: boolean;
  setHasGameStarted: React.Dispatch<React.SetStateAction<boolean>>;
  hasUserLost: boolean;
  setHasUserLost: React.Dispatch<React.SetStateAction<boolean>>;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  isButtonVisible: boolean;
  setIsButtonVisible: React.Dispatch<React.SetStateAction<boolean>>;
  InitialRightArtist: Artist | null;
  setInitialRightArtist: React.Dispatch<React.SetStateAction<Artist | null>>;
  InitialLeftArtist: Artist | null;
  setInitialLeftArtist: React.Dispatch<React.SetStateAction<Artist | null>>;
  userId: string;
  setUserId: (id: string) => void;
}

export interface Artist {
  artist: string;
  listeners: string;
  image_url: string;
  spotifyId?: string;
}

export interface GuessArtist {
  artist: string;
  listeners: string;
  image_url: string;
  guessAnswer: (guess: boolean) => void;
}

export interface Score {
  score: number;
}

export interface Listeners {
  listeners: number;
}
