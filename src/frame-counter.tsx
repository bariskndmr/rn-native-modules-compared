import { useEffect, useState } from "react";
import { Text } from "react-native";

export function JsFrameCounter() {
  const [frames, setFrames] = useState(0);

  useEffect(() => {
    let id: number;
    const loop = () => {
      setFrames((f) => f + 1);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  return <Text>JS frames: {frames}</Text>;
}
