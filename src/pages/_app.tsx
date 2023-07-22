import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { Layout } from "~/components/Layout";
import { RecentFilesProvider } from "~/contexts/RecentFilesContext";

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
