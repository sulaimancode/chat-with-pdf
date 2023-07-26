import React from "react";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

const QuestionInput = React.forwardRef<
  HTMLTextAreaElement,
  {
    query: string;
    handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    sendQuery: () => void;
    setQuery: (query: string) => void;
  }
>(({ query, handleChange, sendQuery, setQuery }, ref) => {
  return (
    <div className="absolute bottom-0 left-0 flex w-full items-center justify-center gap-2 bg-custom-gradient p-4 dark:bg-custom-gradient-dark">
      <div className="flex w-full rounded-xl bg-gray3 p-2 shadow-md dark:bg-slate3 sm:w-4/6 lg:w-5/12">
        <textarea
          ref={ref}
          value={query}
          className="max-h-20 w-full resize-none border-0 bg-transparent outline-none"
          rows={1}
          placeholder="Ask me anything"
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              if (query.length === 0) return;

              sendQuery();
              setQuery("");
            }
          }}
        />
      </div>

      <button onClick={sendQuery} className="mb-2 self-end">
        <span className="sr-only">send query</span>
        <PaperPlaneIcon width={20} height={20} />
      </button>
    </div>
  );
});

QuestionInput.displayName = "QuestionInput";

export { QuestionInput };
