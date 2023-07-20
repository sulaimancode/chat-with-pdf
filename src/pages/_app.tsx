import { type AppType } from "next/app";
import { api } from "~/utils/api";
import { PdfProvider } from "~/contexts/pdfFile";
import "~/styles/globals.css";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

const isServer = typeof window === "undefined";

if (!isServer) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
  ).toString();
}

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <PdfProvider>
      <Component {...pageProps} />
    </PdfProvider>
  );
};

export default api.withTRPC(MyApp);
