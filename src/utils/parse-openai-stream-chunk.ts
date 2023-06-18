export const parseOpenAIStreamChunk = (
  chunk: string,
  onData: (data: string) => void
) => {
  const lines: string[] = chunk
    .toString()
    .split("\n")
    .filter((line: string) => line.trim() !== "");

  for (const line of lines) {
    const message = line.replace(/^data: /, "");
    if (message === "[DONE]") {
      return; // Stream finished
    }

    try {
      //eslint-disable-next-line
      const parsed = JSON.parse(message);
      //eslint-disable-next-line
      const content = parsed.choices[0].delta.content;

      if (content) {
        onData(content as string);
      }
    } catch (error) {
      console.log("Could not JSON parse stream message", message, error);
    }
  }
};
