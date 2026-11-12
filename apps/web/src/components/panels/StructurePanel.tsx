import { ListTree } from "lucide-react";
import type { AnalysisResult } from "../../lib/language";
export function StructurePanel({ result }: { result: AnalysisResult | null }) {
  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <div className="panel-title">
          <ListTree size={16} /> Program structure
        </div>
      </div>
      {!result ? (
        <div className="empty-state">
          The parsed syntax tree will appear here.
        </div>
      ) : (
        <pre className="json-view">
          <code>{JSON.stringify(result.ast, null, 2)}</code>
        </pre>
      )}
    </section>
  );
}
