import { Score } from "@/utils/Types";

const CurrentScore = (props: Score) => {
  const { score } = props;

  return (
    <div className="absolute right-4 top-4 text-xl font-bold text-white drop-shadow-md md:top-8 md:right-8">
      Puntaje: {score}
    </div>
  );
};

export default CurrentScore;
