import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { prisma } from "~/utils/prisma";
import Head from "next/head";
import React, { useContext, useEffect, useRef, useState } from "react";

import { ScrollArea, ScrollAreaViewport } from "~/components/ScrollArea";
import { parseOpenAIStreamChunk } from "~/utils/parse-openai-stream-chunk";
import { Question } from "~/components/Question";
import { Answer } from "~/components/Answer";
import { QuestionInput } from "~/components/QuestionInput";
import { PdfContext } from "~/contexts/pdfFile";

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
      documentName: document?.name ?? null,
    },
  };
};

const Chat: NextPage = ({
  documentId,
  documentName,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [query, setQuery] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [chat, setChat] = useState<string[]>([]);
  const [answerCompleted, setAnswerCompleted] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(false);
  const [objectUrl, setObjectUrl] = useState<string>("");

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const chatRootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { pdfFile, setPdfFile } = useContext(PdfContext);

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

  useEffect(() => {
    if (pdfFile) {
      const url = window.URL.createObjectURL(pdfFile as File);
      setObjectUrl(url);

      return () => window.URL.revokeObjectURL(url);
    }
  }, [pdfFile]);

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

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;

    if (files && files[0]) {
      setPdfFile(files[0] || null);
    }
  };

  const sendQuery = () => {
    setLoading(true);
    setChat((prev) => [...prev, query, ""]);

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
        <title>Chat with document</title>
        <meta name="description" content="Chat with document using openai" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="relative grid h-screen grid-cols-2">
        <div className="flex h-full flex-col overflow-hidden pl-1 pt-1">
          {pdfFile ? (
            <iframe src={objectUrl} className="h-full" />
          ) : (
            <div className="flex h-full items-center justify-center gap-2">
              <p>Document unloaded</p>

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
                Choose {documentName} to view PDF
              </button>
            </div>
          )}
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
      </div>
    </>
  );
};

export default Chat;
