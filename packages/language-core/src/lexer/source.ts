export interface SourcePosition { line: number; column: number; offset: number; }
export interface SourceSpan { start: SourcePosition; end: SourcePosition; }
