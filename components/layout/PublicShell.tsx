import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-w-0 overflow-x-clip pt-20">{children}</main>
      <Footer />
    </>
  );
}
