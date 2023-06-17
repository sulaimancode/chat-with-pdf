/* eslint-disable */
import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const response = (await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "What is a bitcoin?" }],
        max_tokens: 150,
        temperature: 0,
        stream: true,
      },
      { responseType: "stream" }
    )) as any;

    response.data.on("data", (data: any) => {
      const lines: string[] = data
        .toString()
        .split("\n")
        .filter((line: string) => line.trim() !== "");

      for (const line of lines) {
        const message = line.replace(/^data: /, "");
        if (message === "[DONE]") {
          res.end();
          return; // Stream finished
        }
        try {
          const parsed = JSON.parse(message);
          const content = parsed.choices[0].delta.content;

          if (content) {
            res.write(`data: ${parsed.choices[0].delta.content}\n\n`);
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
}
