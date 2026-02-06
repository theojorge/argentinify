import type { Listeners } from "@/utils/Types";
import { useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

export function Listeners(props: Listeners) {
  const { listeners } = props;

  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 750 });

  useEffect(() => {
    const numericValue =
      typeof listeners === "string" ? parseInt(listeners) : listeners;
    motionValue.set(numericValue);
  }, [motionValue, listeners]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("en-US").format(
            latest.toFixed(0)
          );
        }
      }),
    [springValue]
  );

  return (
    <span
      className="text-center text-6xl font-bold text-green-400 drop-shadow-md"
      ref={ref}
    />
  );
}
