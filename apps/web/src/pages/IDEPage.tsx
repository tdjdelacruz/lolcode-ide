import { useMemo, useState } from "react";
import { Braces, Code2, ListTree } from "lucide-react";
import { EditorPanel } from "../components/editor/EditorPanel";
import { DiagnosticsPanel } from "../components/panels/DiagnosticsPanel";
import { SymbolsPanel } from "../components/panels/SymbolsPanel";
import { StructurePanel } from "../components/panels/StructurePanel";
import { analyzeSource } from "../lib/language";
import { starterCode } from "../lib/samples";
type Tab = "problems" | "symbols" | "ast";
export function IDEPage() {
  const [code, setCode] = useState(starterCode);
  const [result, setResult] = useState<ReturnType<typeof analyzeSource> | null>(
    null,
  );
  const [tab, setTab] = useState<Tab>("problems");
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const lines = useMemo(() => code.split(/\r\n|\r|\n/).length, [code]);
  function run() {
    try {
      setResult(analyzeSource(code));
      setAnalyzedAt(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
      window.alert("Analysis failed. Check the browser console.");
    }
  }
  function reset() {
    setCode(starterCode);
    setResult(null);
    setAnalyzedAt(null);
  }
  return (
    <main className="workspace">
      <div className="page-intro">
        <div>
          <div className="eyebrow">ONLINE LANGUAGE WORKBENCH</div>
          <h1>LOLCODE Playground</h1>
          <p>
            Write LOLCODE, inspect its syntax tree, and catch semantic issues.
          </p>
        </div>
        <div className="intro-chip">
          <span className="engine-dot" /> Analysis engine ready
        </div>
      </div>
      <div className="workbench-grid">
        <EditorPanel
          code={code}
          onChange={setCode}
          onAnalyze={run}
          onReset={reset}
        />
        <div className="right-column">
          <div className="result-tabs">
            <button
              className={
                tab === "problems" ? "result-tab active" : "result-tab"
              }
              onClick={() => setTab("problems")}
            >
              <Code2 size={15} /> Problems
            </button>
            <button
              className={tab === "symbols" ? "result-tab active" : "result-tab"}
              onClick={() => setTab("symbols")}
            >
              <Braces size={15} /> Symbols
            </button>
            <button
              className={tab === "ast" ? "result-tab active" : "result-tab"}
              onClick={() => setTab("ast")}
            >
              <ListTree size={15} /> AST
            </button>
          </div>
          {tab === "problems" && <DiagnosticsPanel result={result} />}
          {tab === "symbols" && <SymbolsPanel result={result} />}
          {tab === "ast" && <StructurePanel result={result} />}
          <div className="analysis-footnote">
            <span>
              {result
                ? `${result.tokens.length} tokens · ${lines} lines`
                : `${lines} lines · Not analyzed`}
            </span>
            <span>{analyzedAt ? `Last analyzed ${analyzedAt}` : "Ready"}</span>
          </div>
        </div>
      </div>
      <footer className="app-footer">
        <span>LOLCODE Studio</span>
        <span>
          Static analysis only · Program execution is not supported yet
        </span>
      </footer>
    </main>
  );
}
