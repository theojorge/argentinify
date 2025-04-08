export interface Artist {
  artist: string;
  listeners: string;
  image_url: string;
  spotifyId?: string;
}

export interface Score {
  score: number;
}

export interface Listeners {
  listeners: string | number;
}

export interface GuessArtist extends Artist {
  guessAnswer: (guess: boolean) => void;
}

export interface GameContextType {
  hasGameStarted: boolean;
  setHasGameStarted: (value: boolean) => void;
  hasUserLost: boolean;
  setHasUserLost: (value: boolean) => void;
  score: number;
  setScore: (value: React.SetStateAction<number>) => void;
  isButtonVisible: boolean;
  setIsButtonVisible: (value: boolean) => void;
  InitialRightArtist: Artist | null;
  setInitialRightArtist: (artist: Artist | null) => void;
  InitialLeftArtist: Artist | null;
  setInitialLeftArtist: (artist: Artist | null) => void;
  userId: string;
  setUserId: (id: string) => void;
}
