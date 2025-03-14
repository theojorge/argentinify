import { Score } from "@/utils/Types";

const HighScore = (props: Score) => {
  const { score } = props;

  return (
    <div className="absolute left-4 top-4 text-xl font-bold text-white drop-shadow-md md:top-8 md:left-8">
      Puntaje mas alto: {score}
    </div>
  );
};

export default HighScore;
