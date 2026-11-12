import { Variable } from "lucide-react";
import type { AnalysisResult } from "../../lib/language";
export function SymbolsPanel({ result }: { result: AnalysisResult | null }) {
  const symbols = result ? [...result.semantic.symbols.values()] : [];
  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <div className="panel-title">
          <Variable size={16} /> Symbol table{" "}
          <span className="count-badge">{symbols.length}</span>
        </div>
      </div>
      {!result ? (
        <div className="empty-state">
          Variables will appear here after analysis.
        </div>
      ) : symbols.length === 0 ? (
        <div className="empty-state">No variables declared.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((s) => (
                <tr key={s.name}>
                  <td className="symbol-name">{s.name}</td>
                  <td>
                    <span className={`type-pill type-${s.type.toLowerCase()}`}>
                      {s.type}
                    </span>
                  </td>
                  <td>
                    {s.initialized ? (
                      <span className="state-ready">Initialized</span>
                    ) : (
                      <span className="state-unset">Uninitialized</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
