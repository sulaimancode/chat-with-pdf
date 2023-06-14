import { type NextPage } from "next";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import { DotsHorizontalIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { ScrollArea, ScrollAreaViewport } from "~/components/ScrollArea";
import { useBreakpoint } from "~/hooks/useBreakpoints";

const isServer = typeof window === "undefined";

if (!isServer) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
  ).toString();
}

const options = {
  cMapUrl: "cmaps/",
  standardFontDataUrl: "standard_fonts/",
};

type PDFFile = string | File | null;

const QuestionInput = React.forwardRef<
  HTMLTextAreaElement,
  {
    query: string;
    handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    sendQuery: () => void;
    setQuery: (query: string) => void;
  }
>(({ query, handleChange, sendQuery, setQuery }, ref) => {
  return (
    <div className="bg-custom-gradient dark:bg-custom-gradient-dark absolute bottom-0 left-0 flex w-full items-center justify-center gap-2 p-4">
      <div className="bg-gray3 dark:bg-slate3 flex w-5/12 rounded-xl p-2 shadow-md">
        <textarea
          ref={ref}
          value={query}
          className="max-h-20 w-full resize-none border-0 bg-transparent outline-none"
          rows={1}
          placeholder="Ask me anything"
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              if (query.length === 0) return;

              sendQuery();
              setQuery("");
            }
          }}
        />
      </div>

      <button onClick={sendQuery} className="mb-2 self-end">
        <span className="sr-only">send query</span>
        <PaperPlaneIcon width={20} height={20} />
      </button>
    </div>
  );
});

QuestionInput.displayName = "QuestionInput";

const Question = ({ question }: { question: string }) => (
  <p className="border-gray6 dark:border-slate6 w-fit self-end rounded-t-lg rounded-bl-lg border px-3 py-1">
    {question}
  </p>
);

const Answer = ({
  loading,
  fullAnswer,
  streamingAnswer,
  last,
}: {
  loading: boolean;
  fullAnswer: string;
  streamingAnswer: string[];
  last: boolean;
}) => {
  const cssClasses = "rounded-lg shadow-md dark:bg-slate4 bg-gray4";

  if (last && loading) {
    return (
      <div className={`${cssClasses} pl-2`}>
        <DotsHorizontalIcon width="60" height="60" className="animate-pulse" />
      </div>
    );
  }

  return (
    <p className={`${cssClasses} p-4`}>
      {streamingAnswer.length > 0 && last ? streamingAnswer : fullAnswer}
    </p>
  );
};

const mockChat = [
  "short answer, what is a bitcoin?",
  "Bitcoin is a cryptocurrency invented in 2008 by an unknown person or group of people using the name Satoshi Nakamoto. The currency began use in 2009 when its implementation was released as open-source software.",
  "what is a blockchain?",
  "blockchain is a decentralized, distributed, public ledger that records the proof of work done by the miners. It is the underlying technology that powers the bitcoin network.",
  "what is a proof of work?",
  "proof of work is a piece of data which is difficult (costly, time-consuming) to produce but easy for others to verify and which satisfies certain requirements. Producing a proof of work can be a random process with low probability so that a lot of trial and error is required on average before a valid proof of work is generated.",
  "who is satoshi nakamoto?",
  "Satoshi Nakamoto is the name used by the presumed pseudonymous person or persons who developed bitcoin, authored the bitcoin white paper, and created and deployed bitcoin's original reference implementation. As part of the implementation, Nakamoto also devised the first blockchain database.",
];

const Home: NextPage = () => {
  const [query, setQuery] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [chat, setChat] = useState<string[]>(mockChat);
  const [answerCompleted, setAnswerCompleted] = useState<boolean>(false);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [file, setFile] = useState<PDFFile>(null);
  const [scale, setScale] = useState<number>(1.2);

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const chatRootRef = useRef<HTMLDivElement>(null);

  const breakpoint = useBreakpoint();

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(event.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const onDocumentLoadSuccess = ({
    numPages: nextNumPages,
  }: PDFDocumentProxy) => {
    setNumPages(nextNumPages);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;

    if (files && files[0]) {
      setFile(files[0] || null);
    }
  };

  useEffect(() => {
    const scaleMap = {
      sm: 0.95,
      md: 1.0,
      lg: 1.2,
      xl: 1.5,
      "2xl": 1.5,
    };

    setScale(scaleMap[breakpoint] || 1.0);
  }, [breakpoint]);

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

  const sendQuery = () => {
    setLoading(true);
    setChat((prev) => [...prev, query, ""]);

    const eventSource = new EventSource("/api/v1/stream?query=" + query);

    eventSource.onopen = () => {
      setLoading(false);
    };

    eventSource.onmessage = (event) => {
      setCurrentAnswer((prev) => [...prev, event.data as string]);
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
      <main className="bg-gray2 text-gray12 dark:bg-slate2 dark:text-slate12 relative grid h-screen grid-cols-2">
        <div className="flex h-full flex-col overflow-hidden pl-8 pt-8">
          {!file && (
            <>
              <label htmlFor="file">Load from file:</label>
              <input onChange={onFileChange} type="file" />
            </>
          )}
          <ScrollArea className="border-slate7 h-[80%] rounded-lg border">
            <ScrollAreaViewport className="h-full">
              {file && (
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  options={options}
                >
                  <div className="flex flex-col">
                    {Array.from(new Array(numPages), (el, index) => (
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        scale={1.3}
                        className="!bg-gray2 dark:!bg-slate2 flex items-center justify-center"
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

export default Home;
