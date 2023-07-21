import React, { createContext, useState } from "react";

type PDFFile = string | File | null;

type RecentFile = {
  file: PDFFile;
  docId: string;
  docName: string;
};

const RecentFilesContext = createContext<{
  recentFiles: RecentFile[];
  addFile: (recentFile: RecentFile) => void;
  currentFile: PDFFile;
  setCurrentFile: (file: PDFFile) => void;
}>({
  recentFiles: [],
  addFile: () => null,
  currentFile: null,
  setCurrentFile: () => null,
});

const RecentFilesProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [currentFile, setCurrentFile] = useState<PDFFile>(null);

  const addFile = (file: RecentFile) => {
    setRecentFiles((prev) => [...prev, file]);
  };

  return (
    <RecentFilesContext.Provider
      value={{ currentFile, setCurrentFile, recentFiles, addFile }}
    >
      {children}
    </RecentFilesContext.Provider>
  );
};

export { RecentFilesContext, RecentFilesProvider };
