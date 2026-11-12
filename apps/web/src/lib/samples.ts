export const starterCode = `HAI 1.3
BTW Welcome to LOLCODE Studio!
I HAS A name ITZ "World"
I HAS A score ITZ SUM OF 10 AN 20
VISIBLE "Hello," name
VISIBLE score
KTHXBYE`;
export const examples = [
  { name: "Hello World", code: `HAI 1.3\nVISIBLE "Hello, World!"\nKTHXBYE` },
  {
    name: "Variables and arithmetic",
    code: `HAI 1.3\nI HAS A first ITZ 10\nI HAS A second ITZ 20\nI HAS A total ITZ SUM OF first AN second\nVISIBLE total\nKTHXBYE`,
  },
  {
    name: "Semantic errors",
    code: `HAI 1.3\nI HAS A total ITZ SUM OF "ten" AN 20\nVISIBLE missingVariable\nKTHXBYE`,
  },
];
