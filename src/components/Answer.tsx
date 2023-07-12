import { DotsHorizontalIcon } from "@radix-ui/react-icons";

const Answer = ({
  loading,
  fullAnswer,
  streamingAnswer,
  last,
}: {
  loading: boolean;
  fullAnswer: string;
  streamingAnswer: string[];
  last: boolean;
}) => {
  const cssClasses = "rounded-lg shadow-md dark:bg-slate4 bg-gray4";

  if (last && loading) {
    return (
      <div className={`${cssClasses} pl-2`}>
        <DotsHorizontalIcon width="60" height="60" className="animate-pulse" />
      </div>
    );
  }

  return (
    <p className={`${cssClasses} p-4`}>
      {streamingAnswer.length > 0 && last ? streamingAnswer : fullAnswer}
    </p>
  );
};

export { Answer };
