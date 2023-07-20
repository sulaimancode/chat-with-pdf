import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { prisma } from "~/utils/prisma";
import Head from "next/head";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";

import type { PDFDocumentProxy } from "pdfjs-dist";

import { ScrollArea, ScrollAreaViewport } from "~/components/ScrollArea";
import { parseOpenAIStreamChunk } from "~/utils/parse-openai-stream-chunk";
import { Question } from "~/components/Question";
import { Answer } from "~/components/Answer";
import { QuestionInput } from "~/components/QuestionInput";
import { PdfContext } from "~/contexts/pdfFile";

const options = {
  cMapUrl: "cmaps/",
  standardFontDataUrl: "standard_fonts/",
};

type PDFFile = string | File | null;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { docId } = params!;

  const document = await prisma.document.findUnique({
    where: {
      id: docId as string,
    },
  });

  return {
    props: {
      documentId: document?.id ?? null,
    },
  };
};

const Chat: NextPage = ({
  documentId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [query, setQuery] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [chat, setChat] = useState<string[]>([]);
  const [answerCompleted, setAnswerCompleted] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(false);
  const [numPages, setNumPages] = useState<number>(0);

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const chatRootRef = useRef<HTMLDivElement>(null);

  const { pdfFile, setPdfFile } = useContext(PdfContext);
  console.log(pdfFile);

  useEffect(() => {
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsAtBottom(true);
          } else {
            setIsAtBottom(false);
          }
        });
      },
      {
        root: chatRootRef.current,
        rootMargin: "0px",
        threshold: 1.0,
      }
    );

    if (sentinelRef.current) {
      intersectionObserver.observe(sentinelRef.current);
    }

    return () => {
      intersectionObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollViewportRef.current && chat[chat.length - 1] === "") {
      scrollViewportRef.current.scrollTop =
        scrollViewportRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    const scrollViewport = scrollViewportRef.current;

    if (scrollViewport && currentAnswer.length > 0 && isAtBottom) {
      scrollViewport.scrollTop = scrollViewport.scrollHeight;
    }
  }, [currentAnswer, isAtBottom]);

  useEffect(() => {
    if (answerCompleted) {
      setChat((prev) => [...prev.slice(0, -1), currentAnswer.join("")]);
      setCurrentAnswer([]);
      setAnswerCompleted(false);
    }
  }, [answerCompleted, currentAnswer]);

  if (!documentId || typeof documentId !== "string") {
    return <div>404 document does not exist</div>;
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(event.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const onDocumentLoadSuccess = (d: PDFDocumentProxy) => {
    setNumPages(d.numPages);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;

    if (files && files[0]) {
      setPdfFile(files[0] || null);
    }
  };

  const sendQuery = () => {
    setLoading(true);
    setChat((prev) => [...prev, query, ""]);

    // const docName = (typeof file !== "string" && file?.name) || "";

    const eventSource = new EventSource(
      `/api/openai-chat-stream?q=${query}&docId=${documentId}`
    );

    eventSource.onopen = () => {
      setLoading(false);
    };

    eventSource.onmessage = (event) => {
      const data = event.data as unknown as string;

      parseOpenAIStreamChunk(data, (data) =>
        setCurrentAnswer((prev) => [...prev, data])
      );
    };

    eventSource.onerror = () => {
      eventSource.close();
      setAnswerCompleted(true);
    };
  };
  return (
    <>
      <Head>
        <title>Ask some text questions</title>
        <meta
          name="description"
          content="Upload some text and ask questions using gpt"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative grid h-screen grid-cols-2 bg-gray2 text-gray12 dark:bg-slate2 dark:text-slate12">
        <div className="flex h-full flex-col overflow-hidden pl-8 pt-8">
          <ScrollArea className="h-[80%] rounded-lg border border-slate7">
            <ScrollAreaViewport className="h-full">
              {pdfFile && (
                <Document
                  file={pdfFile}
                  /* eslint-disable-next-line */
                  onLoadSuccess={onDocumentLoadSuccess}
                  options={options}
                >
                  <div className="flex flex-col">
                    {Array.from(new Array(numPages), (el, index) => (
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        className="flex items-center justify-center !bg-gray2 dark:!bg-slate2"
                        scale={1.2}
                      />
                    ))}
                  </div>
                </Document>
              )}
            </ScrollAreaViewport>
          </ScrollArea>
        </div>
        <div
          className="relative flex h-full flex-col overflow-hidden"
          ref={chatRootRef}
        >
          <ScrollArea>
            <ScrollAreaViewport className="h-full p-8" ref={scrollViewportRef}>
              <div className="relative flex flex-col gap-3">
                {chat.map((message, index) => {
                  return index % 2 === 0 ? (
                    <Question key={index} question={message} />
                  ) : (
                    <Answer
                      key={index}
                      streamingAnswer={currentAnswer}
                      fullAnswer={message}
                      last={index === chat.length - 1}
                      loading={loading}
                    />
                  );
                })}
                <div className="h-24" />
                <div
                  className="absolute bottom-0 opacity-0"
                  ref={sentinelRef}
                  aria-hidden="true"
                >
                  sentinel element
                </div>
              </div>
            </ScrollAreaViewport>
          </ScrollArea>
        </div>

        <QuestionInput
          query={query}
          setQuery={setQuery}
          handleChange={handleChange}
          sendQuery={sendQuery}
          ref={textareaRef}
        />
      </main>
    </>
  );
};

export default Chat;