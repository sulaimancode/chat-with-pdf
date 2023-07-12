const Question = ({ question }: { question: string }) => (
  <p className="w-fit self-end rounded-t-lg rounded-bl-lg bg-sky9 px-3 py-1 dark:bg-blue9">
    {question}
  </p>
);

export { Question };
