import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

/**
 * Root layout wrapper — Header + page content + Footer.
 * Used as the layout route element in App.tsx.
 *
 * The ground is warm ivory, not a cool near-white: it is the dominant
 * surface of the whole GlobeTrotter identity, and every page that sits in
 * this layout inherits it.
 */
export default function Layout() {
  return (
    <div className="bg-editorial-bg font-body-md text-editorial-primary min-h-screen flex flex-col">
      <Header />
      <main className="w-full pt-20 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
