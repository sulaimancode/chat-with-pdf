/* eslint-disable */
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import PDFParser from "pdf2json";
import { encode } from "gpt-3-encoder";
import { Configuration, OpenAIApi } from "openai-edge";
import { env } from "~/env.mjs";

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const prisma = new PrismaClient();

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
    const documentName = req.query.documentName as string;
    const pdfData = req.body as string;

    console.log(`Ingesting ${documentName}...`);
    const existingDocument = await prisma.document.findFirst({
      where: { name: documentName },
    });

    if (existingDocument) {
      res
        .status(200)
        .json({ status: "success", message: "PDF already exists" });
      return;
    }

    console.log(`Creating ${documentName} entry...`);
    const newDocument = await prisma.document.create({
      data: {
        name: documentName,
      },
    });

    console.log(`Parsing ${documentName}...`);
    const buffer = Buffer.from(pdfData, "base64");
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", (errData) =>
      console.error(
        `Error parsing document ${documentName}, message: ${errData}`
      )
    );
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      pdfData.Pages.forEach(async (page, index) => {
        console.log(`Processing page ${index + 1}...`);
        const texts = page.Texts.map((text) => {
          if (text && text.R.length > 0) {
            return decodeURIComponent(text.R[0]!.T);
          }

          return "";
        });

        const content = texts.join(" ").replace(/\n/g, " ");
        const tokens = encode(content);

        console.log(`Generating embedding for page ${index + 1}...`);
        const embedding = await generateEmbedding(content);

        const newChunk = await prisma.chunk.create({
          data: {
            content,
            tokenCount: tokens.length,
            documentId: newDocument.id,
            page: index + 1,
          },
        });

        await prisma.$executeRaw`
            UPDATE chunk
            SET embedding = ${embedding}::vector
            WHERE id = ${newChunk.id}
        `;
      });
    });
    pdfParser.parseBuffer(buffer);

    res
      .status(200)
      .json({ status: "success", message: "PDF uploaded successfully." });
  } else {
    res.status(405).json({ error: "Method not allowed. Please use POST." });
  }
}
