import React, { type ReactElement } from "react";
import * as RadixScrollArea from "@radix-ui/react-scroll-area";

const { Root, Viewport, Scrollbar, Thumb, Corner } = RadixScrollArea;

const ScrollArea = ({
  children,
  className,
}: {
  children: ReactElement;
  className?: string;
}) => {
  return (
    <Root className={`overflow-hidden ${className || ""}`}>
      {children}
      <Scrollbar
        className="bg-blackA6 hover:bg-blackA8 z-10 flex touch-none select-none p-0.5
                        transition-colors duration-[160ms] ease-out data-[orientation=horizontal]:h-2.5 
                        data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
        orientation="vertical"
      >
        <Thumb
          className="bg-mauve10 relative flex-1 rounded-[10px] before:absolute
                            before:left-1/2 before:top-1/2 before:h-full before:min-h-[44px]
                            before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']"
        />
      </Scrollbar>
      <Scrollbar
        className="bg-blackA6 hover:bg-blackA8 z-10 flex touch-none select-none p-0.5
                        transition-colors duration-[160ms] ease-out data-[orientation=horizontal]:h-2.5
                        data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
        orientation="horizontal"
      >
        <Thumb
          className="bg-mauve10 relative flex-1 rounded-[10px] before:absolute
                            before:left-1/2 before:top-1/2 before:h-full before:min-h-[44px] before:w-full
                            before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']"
        />
      </Scrollbar>
      <Corner className="bg-blackA8" />
    </Root>
  );
};

export { ScrollArea, Viewport as ScrollAreaViewport };
