/* eslint-disable */
import type { NextApiRequest, NextApiResponse } from "next";
import { CreateChatCompletionRequest } from "openai";
import { streamOpenAIResponse } from "~/utils/stream-openai-response";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const openaiCompletionOptions: CreateChatCompletionRequest = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "What is a bitcoin?" }],
    max_tokens: 150,
    temperature: 0,
    stream: true,
  };

  const onData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  streamOpenAIResponse(openaiCompletionOptions, onData, () => res.end());
}
