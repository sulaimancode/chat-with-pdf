import React, { createContext, useState } from "react";
type PDFFile = string | File | null;

const PdfContext = createContext<{
  pdfFile: PDFFile;
  setPdfFile: (file: PDFFile) => void;
}>({ pdfFile: null, setPdfFile: () => null });

export const PdfProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [pdfFile, setPdfFile] = useState<PDFFile>(null);

  return (
    <PdfContext.Provider value={{ pdfFile, setPdfFile }}>
      {children}
    </PdfContext.Provider>
  );
};
