import { Info } from "lucide-react";
const examples = [
  ["Program structure", "HAI 1.3\n  BTW Your program goes here\nKTHXBYE"],
  ["Declare a variable", "I HAS A score ITZ 100"],
  ["Display output", 'VISIBLE "Hello, world!"'],
  ["Read input", "GIMMEH username"],
  ["Arithmetic", "SUM OF 10 AN 20"],
  [
    "Conditional",
    'O RLY?\n  YA RLY\n    VISIBLE "WIN"\n  NO WAI\n    VISIBLE "FAIL"\nOIC',
  ],
];
export function DocsPage() {
  return (
    <main className="docs-page">
      <div className="page-intro">
        <div>
          <div className="eyebrow">REFERENCE</div>
          <h1>Language guide</h1>
          <p>
            A quick reference for the LOLCODE 1.3 subset currently supported by
            this workbench.
          </p>
        </div>
      </div>
      <div className="docs-notice">
        <Info size={18} />
        <span>
          This is a deliberately limited language subset. Unsupported LOLCODE
          features may be reported as syntax errors.
        </span>
      </div>
      <div className="docs-grid">
        {examples.map(([title, code]) => (
          <article className="panel doc-card" key={title}>
            <h2>{title}</h2>
            <pre>
              <code>{code}</code>
            </pre>
          </article>
        ))}
      </div>
      <section className="panel docs-card-wide">
        <h2>Supported static checks</h2>
        <ul>
          <li>
            Variable declarations, duplicate names, undeclared references, and
            initialization.
          </li>
          <li>Numeric arithmetic operand compatibility.</li>
          <li>Boolean operator operand compatibility.</li>
          <li>Comparison operand compatibility.</li>
          <li>Basic conditional branch analysis.</li>
        </ul>
        <p className="muted">
          The analyzer does not execute programs or evaluate runtime values.
        </p>
      </section>
    </main>
  );
}
