/* eslint-disable */
import type { NextApiRequest } from "next";
import { openai } from "~/utils/openai";
import { createClient } from "@supabase/supabase-js";
import { env } from "~/env.mjs";

export const config = {
  runtime: "edge",
};

async function generateEmbedding(input: string) {
  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input,
  });

  const embeddingData = await embeddingResponse.json();
  const [{ embedding }] = (embeddingData as any).data;
  return embedding;
}

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: NextApiRequest) {
  try {
    if (!supabaseUrl) {
      throw new Error("Missing environment variable SUPABASE_URL");
    }

    if (!supabaseServiceRoleKey) {
      throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // req.query doesn't work for some reason ??
    const searchParams = req.url?.split("?")[1];
    const query = new URLSearchParams(searchParams);
    const question = query.get("q");
    const doc = query.get("doc");

    const embedding = await generateEmbedding(
      (question as string)?.replace(/\n/g, " ")
    );

    const postgrestResponse = await supabaseClient.rpc("match_chunk_sections", {
      vectorquery: embedding,
    });

    const error = postgrestResponse.error;
    const chunks = postgrestResponse.data as {
      id: string;
      page: number;
      content: string;
      token_count: number;
      document_id: string;
      similarity: number;
    }[];

    if (error) {
      throw new Error(
        `Failed to get matching chunks. PostgrestError: ${error.message}`
      );
    }

    let tokenCount = 0;
    let contextText = "";

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const content = chunk!.content;
      tokenCount += chunk!.token_count;

      if (tokenCount >= 3000) {
        break;
      }

      contextText += `${content.trim()}\n---\n`;
    }

    const prompt = `
You are a very helpful ai assistant. Given some sections (listed below)
of a document and a question you will give an answer based on the given sections.
Sometimes the name of the document is also - document name is ${doc}.

Context sections: ${contextText}

Question: ${question}
`;
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
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
