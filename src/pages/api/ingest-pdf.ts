import type { NextApiRequest, NextApiResponse } from "next";
import PDFParser from "pdf2json";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const documentName = req.query.documentName as string;
    const pdfData = req.body as string;

    const buffer = Buffer.from(pdfData, "base64");
    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", (errData) => console.error(errData));
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      pdfData.Pages.forEach((page, index) => {
        const texts = page.Texts.map((text) => {
          if (text && text.R.length > 0) {
            return decodeURIComponent(text.R[0]!.T);
          }

          return "";
        });

        console.log(
          `Page number: ${index + 1}, content: ${texts.join(" ")}\n\n`
        );
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
