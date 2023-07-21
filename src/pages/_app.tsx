import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Layout } from "~/components/Layout";
import { RecentFilesProvider } from "~/contexts/RecentFilesContext";

const isServer = typeof window === "undefined";

if (!isServer) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
  ).toString();
}

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <Layout>
      <RecentFilesProvider>
        <Component {...pageProps} />
      </RecentFilesProvider>
    </Layout>
  );
};

export default api.withTRPC(MyApp);
