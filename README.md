[![Node.js CI](https://github.com/spazzymoto/tree-sitter-abl/actions/workflows/node.js.yml/badge.svg)](https://github.com/spazzymoto/tree-sitter-abl/actions/workflows/node.js.yml)

# ABL syntax for tree-sitter

## Development

Install [pre-commit](https://pre-commit.com/#install) and run `pre-commit install` in the root of this repo. This will ensure
that code follows code style of this repo.

File describing grammar is [grammar.js](./grammar.js)

Every time the grammar file changes code generation needs to be run by invoking `npm run gen`

`npm test` command automatically performs code generation

Tests files are located in [test/corpus](./test/corpus)

[Here](https://tree-sitter.github.io/tree-sitter/creating-parsers#command-test) is the documentation on test file syntax

### Running tests

```
npm install --also=dev
npm test
```

### Debbuging

* `npm run parse <file.p>` outputs a syntax tree
* `npm run extract-error <file.p>` shows first offending line

### Goals

This parser is supposed to be used in text editors. As a result:

* it's very lax in what it considers valid ABL parse
* adding extra nodes to have convenient selection anchors is okay

