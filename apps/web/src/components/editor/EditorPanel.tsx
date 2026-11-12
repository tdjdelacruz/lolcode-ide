import Editor from "@monaco-editor/react";
import { Play, RotateCcw, FileCode2 } from "lucide-react";
import { examples } from "../../lib/samples";
interface Props {
  code: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onReset: () => void;
}
export function EditorPanel({ code, onChange, onAnalyze, onReset }: Props) {
  return (
    <section className="panel editor-panel">
      <div className="panel-heading">
        <div className="panel-title">
          <FileCode2 size={16} /> <span>main.lol</span>
          <span className="file-tag">LOLCODE</span>
        </div>
        <div className="editor-actions">
          <select
            className="example-select"
            defaultValue=""
            onChange={(e) => {
              const sample = examples.find((x) => x.name === e.target.value);
              if (sample) onChange(sample.code);
              e.currentTarget.value = "";
            }}
          >
            <option value="" disabled>
              Load example
            </option>
            {examples.map((x) => (
              <option key={x.name}>{x.name}</option>
            ))}
          </select>
          <button
            className="icon-button"
            onClick={onReset}
            title="Reset starter code"
          >
            <RotateCcw size={15} />
          </button>
          <button className="run-button" onClick={onAnalyze}>
            <Play size={15} fill="currentColor" /> Analyze
          </button>
        </div>
      </div>
      <div className="editor-wrap">
        <Editor
          height="100%"
          language="plaintext"
          theme="vs-dark"
          value={code}
          onChange={(v) => onChange(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 18, bottom: 18 },
          }}
        />
      </div>
      <div className="editor-footer">
        <span>LOLCODE 1.3 subset</span>
        <span>Static analysis · No runtime execution</span>
      </div>
    </section>
  );
}
