import Header from "./Header";
import Footer from "./Footer";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
