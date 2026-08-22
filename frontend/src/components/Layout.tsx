import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

/**
 * Root layout wrapper — Header + page content + Footer.
 * Used as the layout route element in App.tsx.
 */
export default function Layout() {
  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen flex flex-col">
      <Header />
      <main className="w-full pt-20 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
