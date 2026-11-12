import { BookOpen, Braces, Code2 } from "lucide-react";
type Page = "ide" | "docs";
export function Header({
  activePage,
  onNavigate,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => onNavigate("ide")}>
        <span className="brand-mark">
          <Braces size={21} />
        </span>
        <span>
          LOLCODE <strong>Studio</strong>
        </span>
        <span className="version-pill">1.3</span>
      </button>
      <nav className="topnav">
        <button
          className={activePage === "ide" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("ide")}
        >
          <Code2 size={16} /> Playground
        </button>
        <button
          className={activePage === "docs" ? "nav-link active" : "nav-link"}
          onClick={() => onNavigate("docs")}
        >
          <BookOpen size={16} /> Language guide
        </button>
      </nav>
      <div className="topbar-right">
        <span className="engine-dot" /> Static analysis enabled
      </div>
    </header>
  );
}
