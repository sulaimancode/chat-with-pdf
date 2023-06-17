/* eslint-disable */
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai";
import { env } from "~/env.mjs";

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const streamOpenAIResponse = async (
  options: CreateChatCompletionRequest,
  onData: (data: string) => void,
  onDone: () => void
) => {
  try {
    const response = (await openai.createChatCompletion(options, {
      responseType: "stream",
    })) as any;

    response.data.on("data", (data: any) => {
      const lines: string[] = data
        .toString()
        .split("\n")
        .filter((line: string) => line.trim() !== "");

      for (const line of lines) {
        const message = line.replace(/^data: /, "");
        if (message === "[DONE]") {
          onDone();
          return; // Stream finished
        }
        try {
          const parsed = JSON.parse(message);
          const content = parsed.choices[0].delta.content;

          if (content) {
            onData(content);
          }
        } catch (error) {
          console.error("Could not JSON parse stream message", message, error);
        }
      }
    });
  } catch (error: any) {
    if (error.response?.status) {
      console.error(error.response.status, error.message);
      error.response.data.on("data", (data: any) => {
        const message = data.toString();
        try {
          const parsed = JSON.parse(message);
          console.error("An error occurred during OpenAI request: ", parsed);
        } catch (error) {
          console.error("An error occurred during OpenAI request: ", message);
        }
      });
    } else {
      console.error("An error occurred during OpenAI request", error);
    }
  }
};
