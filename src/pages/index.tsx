import { type NextPage } from "next";
import { useContext, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { v4 as uuidv4 } from "uuid";
import { Document } from "react-pdf";
import { useRouter } from "next/router";
import { Progress } from "~/components/Progress";
import { RecentFilesContext } from "~/contexts/RecentFilesContext";
import Link from "next/link";

type RawPage = {
  docId: string;
  docName: string;
  page: number;
  content: string;
};

const options = {
  cMapUrl: "cmaps/",
  standardFontDataUrl: "standard_fonts/",
};

const Home: NextPage = () => {
  const { currentFile, setCurrentFile, addFile, recentFiles } =
    useContext(RecentFilesContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [numPromises, setNumPromises] = useState(0);
  const router = useRouter();

  const fileRef = useRef<HTMLInputElement>(null);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;

    if (files && files[0]) {
      setCurrentFile(files[0] || null);
    }
  };

  const uploadPages = async (pages: RawPage[]) => {
    return fetch("/api/upload-pages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pages }),
    })
      .then(() => setProgressCount((prev) => prev + 1))
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  useEffect(() => {
    if (currentFile) {
      setCurrentFile(null);
    }
  }, []);

  const onDocumentLoadSuccess = async (d: PDFDocumentProxy) => {
    if (currentFile) {
      const docName = (currentFile as File).name;
      const docId = uuidv4();
      const chunkSize = 10;
      const promises: Promise<void>[] = [];

      setError(false);
      setLoading(true);
      for (let i = 1; i <= d.numPages; i += chunkSize) {
        const pages: RawPage[] = [];

        for (let j = 0; j < chunkSize && i + j <= d.numPages; j++) {
          const page = await d.getPage(i + j).then((p) => p.getTextContent());
          const pageText = page.items
            .map((item) => (item as TextItem).str)
            .join(" ");

          pages.push({ docId, docName, page: i + j, content: pageText });
        }

        promises.push(uploadPages(pages));
      }

      setNumPromises(promises.length);

      await Promise.all(promises)
        .then(async () => {
          await router.push(`/chat/${docId}`);

          addFile({ docId, docName, file: currentFile as File });
          setLoading(false);
          setProgressCount(0);
          setNumPromises(0);
        })
        .catch((error) => {
          setError(true);
          setLoading(false);
          setProgressCount(0);
          setNumPromises(0);

          console.error("Error:", error);
        });
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-2">
      {loading ? (
        <>
          <p>Preparing document...</p>
          <Progress
            progress={numPromises < 1 ? 0 : (progressCount / numPromises) * 100}
          />
        </>
      ) : (
        <>
          <input
            onChange={onFileChange}
            type="file"
            id="fileElement"
            className="hidden"
            ref={fileRef}
          />
          <button
            onClick={() => {
              if (fileRef.current) fileRef.current.click();
            }}
            className="rounded bg-sky9 px-4 py-2 hover:bg-sky11 dark:bg-blue9 dark:hover:bg-blue11"
          >
            Choose a PDF file
          </button>
          {recentFiles.length > 0 && (
            <div className="m-4 flex flex-col gap-2 self-start">
              <p className="text-lg font-semibold">Recent files</p>
              <div className="flex flex-col gap-1">
                {recentFiles.map((file) => (
                  <Link
                    key={file.docId}
                    onClick={() => {
                      setCurrentFile(file.file);
                    }}
                    href={`/chat/${file.docId}`}
                  >
                    {file.docName}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {currentFile && (
        <Document
          file={currentFile}
          /* eslint-disable-next-line */
          onLoadSuccess={onDocumentLoadSuccess}
          options={options}
        />
      )}

      {error && <p className="text-red-500">Something went wrong!</p>}
    </div>
  );
};

export default Home;
