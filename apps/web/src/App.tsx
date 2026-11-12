import { useState } from "react";
import { Header } from "./components/layout/Header";
import { IDEPage } from "./pages/IDEPage";
import { DocsPage } from "./pages/DocsPage";
import "./styles.css";
type Page = "ide" | "docs";
export default function App() {
  const [page, setPage] = useState<Page>("ide");
  return (
    <div className="app-shell">
      <Header activePage={page} onNavigate={setPage} />
      {page === "ide" ? <IDEPage /> : <DocsPage />}
    </div>
  );
}
