import { Artist } from "@/utils/Types";

const LeftArtist = (props: Artist) => {
  const { artist, listeners, image_url } = props;

  const formatter = new Intl.NumberFormat("en-US");

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
      <h1 className="text-center text-6xl font-bold text-green-400 drop-shadow-md">
        {formatter.format(parseInt(listeners))}
      </h1>
      <p className="text-center text-sm text-white drop-shadow-md">
        oyentes mensuales
      </p>
    </div>
  );
};

export default LeftArtist;
