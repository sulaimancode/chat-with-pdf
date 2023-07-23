import React, { createContext, useEffect, useState } from "react";

type PDFFile = string | File | null;

type RecentFile = {
  file?: PDFFile;
  docId: string;
  docName: string;
};

let filesFromStorage: RecentFile[] = [];
if (typeof window !== "undefined") {
  const localStorage = window.localStorage;
  const recentFilesJson = localStorage.getItem("recentFiles");

  if (recentFilesJson) {
    filesFromStorage = JSON.parse(recentFilesJson) as RecentFile[];
  }
}

const RecentFilesContext = createContext<{
  recentFiles: RecentFile[];
  addFile: (recentFile: RecentFile) => void;
  currentFile: RecentFile | null;
  setCurrentFile: (file: RecentFile | null) => void;
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
  const [currentFile, setCurrentFile] = useState<RecentFile | null>(null);

  const addFile = (file: RecentFile) => {
    setRecentFiles((prev) => [...prev, file]);
  };

  useEffect(() => {
    if (filesFromStorage.length > 0) {
      setRecentFiles(filesFromStorage);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const localStorage = window.localStorage;
      localStorage.setItem(
        "recentFiles",
        JSON.stringify(
          recentFiles.map((file) => ({
            docId: file.docId,
            docName: file.docName,
          }))
        )
      );
    }
  }, [recentFiles]);

  useEffect(() => {
    if (currentFile) {
      const recentFile = recentFiles.find(
        (file) => file.docId === currentFile.docId
      );

      if (recentFile) {
        recentFile.file = currentFile.file;
        setRecentFiles((prev) => {
          const newRecentFiles = prev.filter(
            (file) => file.docId !== recentFile.docId
          );
          return [...newRecentFiles, recentFile];
        });
      }
    }
  }, [currentFile]);

  return (
    <RecentFilesContext.Provider
      value={{ currentFile, setCurrentFile, recentFiles, addFile }}
    >
      {children}
    </RecentFilesContext.Provider>
  );
};

export { RecentFilesContext, RecentFilesProvider };
