import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AnalysisResult } from "../../lib/language";
export function DiagnosticsPanel({
  result,
}: {
  result: AnalysisResult | null;
}) {
  const items = result?.diagnostics ?? [];
  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <div className="panel-title">
          <AlertCircle size={16} /> Problems{" "}
          <span className="count-badge">{items.length}</span>
        </div>
        {result && (
          <span
            className={
              result.hasErrors ? "result-state error" : "result-state success"
            }
          >
            {result.hasErrors ? "Issues found" : "No issues"}
          </span>
        )}
      </div>
      {!result ? (
        <div className="empty-state">
          Press <strong>Analyze</strong> to inspect your program.
        </div>
      ) : items.length === 0 ? (
        <div className="success-state">
          <CheckCircle2 size={20} />
          <div>
            <strong>Looks good!</strong>
            <span>No lexical, syntax, or semantic errors were reported.</span>
          </div>
        </div>
      ) : (
        <div className="diagnostic-list">
          {items.map((d, i) => (
            <div
              className="diagnostic-row"
              key={`${d.code}-${d.span.start.offset}-${i}`}
            >
              <AlertTriangle size={16} className="diagnostic-icon" />
              <div className="diagnostic-content">
                <div className="diagnostic-meta">
                  <strong>{d.code}</strong>
                  <span>
                    Line {d.span.start.line}, Col {d.span.start.column}
                  </span>
                </div>
                <p>{d.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
