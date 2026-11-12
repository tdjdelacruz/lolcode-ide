# LOLCODE Studio web app scaffold

Copy `apps/web/src/` into your existing `apps/web/src/`. Do not overwrite your package.json, Vite config, tsconfig, or index.html.

Install dependencies from the repository root:

```bash
npm install @monaco-editor/react lucide-react -w apps/web
```

If npm workspaces are not configured, run `npm install @monaco-editor/react lucide-react` inside `apps/web`.

The app expects `packages/language-core/src/pipeline/index.ts` to export `analyzeSource`.
The import in `apps/web/src/lib/language.ts` assumes `apps/web` and `packages` are siblings under the repository root. Adjust that path if your structure differs.

Ensure `apps/web/index.html` contains:

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

Run:

```bash
npm run dev -w apps/web
```

Or `cd apps/web && npm run dev`.

Includes Monaco editor, Analyze action, example programs, diagnostics, symbol table, AST inspector, language guide, responsive layout.

Monaco currently uses plaintext mode. Custom LOLCODE syntax highlighting, inline diagnostics, persistence, and program execution are future features. This scaffold has not been compiled against your local repository; verify exported types and paths.
