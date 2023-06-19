import type { NextApiRequest } from "next";
import { Configuration, OpenAIApi } from "openai-edge";
import { env } from "~/env.mjs";

export const config = {
  runtime: "edge",
};

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req: NextApiRequest) {
  //TODO: get the question from the request body
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "What is a bitcoin?" }],
      max_tokens: 150,
      temperature: 0,
      stream: true,
    });

    return new Response(completion.body, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/event-stream;charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify(error), {
      status: 400,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}
