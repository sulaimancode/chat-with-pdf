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
    const { pageNumber, pageText, documentName } = req.body;

    console.log(`Creating ${documentName} entry...`);
    const newOrExistingDocument = await prisma.document.upsert({
      where: { id: documentId },
      update: {},
      create: {
        id: documentId,
        name: documentName,
      },
    });

    const content = pageText.replace(/\n/g, " ");
    const tokens = encode(content);

    console.log(
      `Generating embedding for page ${pageNumber} from document ${documentName}...`
    );
    const embedding = await generateEmbedding(content);

    const newChunk = await prisma.chunk.create({
      data: {
        content,
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

    res.status(200).json({
      status: "success",
      message: `Page ${pageNumber} successfully ingested`,
    });
  } else {
    res.status(405).json({ error: "Method not allowed. Please use POST." });
  }
}
