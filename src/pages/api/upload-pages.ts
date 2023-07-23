/* eslint-disable */
import { openai } from "~/utils/openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { encode } from "gpt-3-encoder";
import { prisma } from "~/utils/prisma";

async function generateEmbedding(input: string) {
  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input,
  });

  const embeddingData = await embeddingResponse.json();
  const [{ embedding }] = (embeddingData as any).data;
  return embedding;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { pages } = req.body;

    const docId = pages[0].docId;
    const docName = pages[0].docName;

    const newOrExistingDocument = await prisma.document.upsert({
      where: { id: docId },
      update: {},
      create: {
        id: docId,
        name: docName,
      },
    });

    for (const page of pages) {
      const { page: pageNumber, content } = page;

      const pageText = content.replace(/\n/g, " ");
      const tokens = encode(pageText);

      const embedding = await generateEmbedding(pageText);

      const newChunk = await prisma.chunk.create({
        data: {
          content: pageText.replace(/\0/g, ""),
          tokenCount: tokens.length,
          documentId: newOrExistingDocument.id,
          page: pageNumber,
        },
      });

      await prisma.$executeRaw`
            UPDATE chunk
            SET embedding = ${embedding}::vector
            WHERE id = ${newChunk.id}
        `;
    }

    res.status(200).json({
      status: "success",
      docId,
      docName,
    });
  } else {
    res.status(405).json({ error: "Method not allowed. Please use POST." });
  }
}
