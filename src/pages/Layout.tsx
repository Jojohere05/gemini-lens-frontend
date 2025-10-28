import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <TabNavigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
