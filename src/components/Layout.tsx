import React from "react";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <main className="h-screen  bg-gray2 text-gray12 dark:bg-slate2 dark:text-slate12">
      {children}
    </main>
  );
};

export { Layout };
