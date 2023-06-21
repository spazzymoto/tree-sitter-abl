#include <tree_sitter/parser.h>

enum { BLOCK_COMMENT, PREPROCESSOR };

void *tree_sitter_abl_external_scanner_create() { return NULL; }

void tree_sitter_abl_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_abl_external_scanner_serialize(void *payload,
                                                    char *buffer) {
  return true;
}

void tree_sitter_abl_external_scanner_deserialize(void *payload,
                                                  const char *buffer,
                                                  unsigned length) {}

bool tree_sitter_abl_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *whitelist) {

  if (!whitelist[PREPROCESSOR] && !whitelist[BLOCK_COMMENT]) {
    return false;
  }

  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
         lexer->lookahead == '\n' || lexer->lookahead == '\r') {
    lexer->advance(lexer, true);
  }

  int32_t next = lexer->lookahead;

  if (next == '{') {
    lexer->advance(lexer, false);

    int depth = 1;

    for (;;) {
      if (depth == 0) {
        lexer->result_symbol = PREPROCESSOR;
        return true;
      }

      switch (lexer->lookahead) {
      case '{':
        depth++;
        break;
      case '}':
        depth--;
        break;
      }

      lexer->advance(lexer, false);
    }
  }

  if (next == '/') {
    lexer->advance(lexer, false);

    if (lexer->lookahead != '*')
      return false;
    lexer->advance(lexer, false);

    int depth = 1;

    for (;;) {
      if (depth == 0) {
        lexer->result_symbol = BLOCK_COMMENT;
        return true;
      }

      switch (lexer->lookahead) {
      case '/':
        lexer->advance(lexer, false);
        if (lexer->lookahead == '*')
          depth++;
        break;
      case '*':
        lexer->advance(lexer, false);
        if (lexer->lookahead == '/')
          depth--;
        break;
      }

      lexer->advance(lexer, false);
    }
  }

  return false;
}
