import React from "react";
import * as RadixProgress from "@radix-ui/react-progress";

const Progress = ({ progress }: { progress: number }) => {
  return (
    <RadixProgress.Root
      className="relative h-[25px] w-[300px] overflow-hidden rounded-full bg-gray-500"
      style={{
        // Fix overflow clipping in Safari
        // https://gist.github.com/domske/b66047671c780a238b51c51ffde8d3a0
        transform: "translateZ(0)",
      }}
      value={progress}
    >
      <RadixProgress.Indicator
        className="ease-[cubic-bezier(0.65, 0, 0.35, 1)] h-full w-full bg-green-500 transition-transform duration-[660ms]"
        style={{ transform: `translateX(-${100 - progress}%)` }}
      />
    </RadixProgress.Root>
  );
};

export { Progress };
