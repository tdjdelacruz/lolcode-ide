import { TokenType } from "./token-types";

const SINGLE: Readonly<Record<string, TokenType>> = {
  HAI: TokenType.HAI,
  KTHXBYE: TokenType.KTHXBYE,
  ITZ: TokenType.ITZ,
  R: TokenType.R,
  VISIBLE: TokenType.VISIBLE,
  GIMMEH: TokenType.GIMMEH,
  IT: TokenType.IT,
  WIN: TokenType.WIN,
  FAIL: TokenType.FAIL,
  NOOB: TokenType.NOOB,
  NOT: TokenType.NOT,
  DIFFRINT: TokenType.DIFFRINT,
  AN: TokenType.AN,
  OIC: TokenType.OIC,
};
const MULTI: ReadonlyArray<readonly [string, TokenType]> = [
  ["QUOSHUNT OF", TokenType.QUOSHUNT_OF],
  ["PRODUKT OF", TokenType.PRODUKT_OF],
  ["SMALLR OF", TokenType.SMALLR_OF],
  ["BOTH SAEM", TokenType.BOTH_SAEM],
  ["EITHER OF", TokenType.EITHER_OF],
  ["I HAS A", TokenType.I_HAS_A],
  ["BOTH OF", TokenType.BOTH_OF],
  ["BIGGR OF", TokenType.BIGGR_OF],
  ["DIFF OF", TokenType.DIFF_OF],
  ["SUM OF", TokenType.SUM_OF],
  ["MOD OF", TokenType.MOD_OF],
  ["WON OF", TokenType.WON_OF],
  ["YA RLY", TokenType.YA_RLY],
  ["NO WAI", TokenType.NO_WAI],
  ["O RLY?", TokenType.O_RLY],
].sort((a, b) => b[0].length - a[0].length);

export function getSingleWordKeyword(word: string): TokenType | undefined {
  return SINGLE[word];
}
export function isIdentifierStart(c: string | undefined): boolean {
  return !!c && /^[A-Za-z]$/.test(c);
}
export function isIdentifierPart(c: string | undefined): boolean {
  return !!c && /^[A-Za-z0-9_]$/.test(c);
}

export function matchMultiWordKeyword(source: string, offset: number) {
  for (const [phrase, type] of MULTI) {
    let i = offset,
      p = 0,
      ok = true;
    while (p < phrase.length) {
      if (phrase[p] === " ") {
        if (source[i] !== " " && source[i] !== "\t") {
          ok = false;
          break;
        }
        while (source[i] === " " || source[i] === "\t") i++;
        p++;
      } else {
        if (source[i] !== phrase[p]) {
          ok = false;
          break;
        }
        i++;
        p++;
      }
    }
    if (ok && !isIdentifierPart(source[i])) return { type, end: i };
  }
  return undefined;
}
