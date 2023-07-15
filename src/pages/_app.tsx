import { type AppType } from "next/app";
import { api } from "~/utils/api";
import { PdfProvider } from "~/contexts/pdfFile";
import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <PdfProvider>
      <Component {...pageProps} />
    </PdfProvider>
  );
};

export default api.withTRPC(MyApp);
