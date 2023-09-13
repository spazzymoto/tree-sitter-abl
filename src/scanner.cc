#include <tree_sitter/parser.h>
#include <string>
#include <cwctype>

namespace {

using std::string;

enum TokenType {
  END_OF_STATEMENT,
  DOT,
  STATEMENT_COLON,
  COLON,
  CHARACTER_LITERAL,
  PREPROCESSOR,
};

struct Scanner {

  void skip(TSLexer *lexer) {
    lexer->advance(lexer, true);
  }

  void advance(TSLexer *lexer) {
    lexer->advance(lexer, false);
  }

  bool eof(TSLexer *lexer) {
    return lexer->eof(lexer);
  }

  unsigned serialize(char *buffer) {
      return 0;
  }

  void deserialize(const char *buffer, unsigned length) {
  }

  bool scan_character_literal(TSLexer *lexer, const char quote) {
    advance(lexer);

    while (!eof(lexer)) {
      if (lexer->lookahead == quote) {
        advance(lexer);
        break;
      }

      if (lexer->lookahead == '~') {
        advance(lexer);    
      }

      advance(lexer);
    }

    lexer->result_symbol = CHARACTER_LITERAL;
    return true;
  }

  bool scan(TSLexer *lexer, const bool *valid_symbols) {
    while (iswspace(lexer->lookahead)) skip(lexer);
      
     if (valid_symbols[END_OF_STATEMENT] || valid_symbols[DOT]) {

        if (lexer->lookahead == '.') {
          advance(lexer);

          if (eof(lexer) || iswspace(lexer->lookahead)) {
            lexer->result_symbol = END_OF_STATEMENT;
            return true;
          } else {
            lexer->result_symbol = DOT;
            return true;
          }
        }
    }

    if (valid_symbols[STATEMENT_COLON] || valid_symbols[COLON]) {

        if (lexer->lookahead == ':') {
          advance(lexer);

          if (iswspace(lexer->lookahead)) {
            lexer->result_symbol = STATEMENT_COLON;
            return true;
          } else {
            lexer->result_symbol = COLON;
            return true;
          }
        }
    }

    if (valid_symbols[CHARACTER_LITERAL]) {
      if (lexer->lookahead == '"') {
        return scan_character_literal(lexer, '"');
      }

      if (lexer->lookahead == '\'') {
        return scan_character_literal(lexer, '\'');    
      }
    }

      if(valid_symbols[PREPROCESSOR]) {
        int level = 0;
        
        if (lexer->lookahead == '{') {
          advance(lexer);

          level++;

          while(!eof(lexer)) {
            if (lexer->lookahead == '}') {
              level--;

              if (level == 0) {
                advance(lexer);
                break;
              }
            }

            if (lexer->lookahead == '{') {
              level++;
            }

            advance(lexer);
          }

          lexer->result_symbol = PREPROCESSOR;
          return true;
        }
      }
      
    return false;
  }

};

}

extern "C" {

void *tree_sitter_abl_external_scanner_create() {
  return new Scanner();
}

bool tree_sitter_abl_external_scanner_scan(void *payload, TSLexer *lexer,
                                            const bool *valid_symbols) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  return scanner->scan(lexer, valid_symbols);
}

unsigned tree_sitter_abl_external_scanner_serialize(void *payload, char *state) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  return scanner->serialize(state);
}

void tree_sitter_abl_external_scanner_deserialize(void *payload, const char *state, unsigned length) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  scanner->deserialize(state, length);
}

void tree_sitter_abl_external_scanner_destroy(void *payload) {
  Scanner *scanner = static_cast<Scanner *>(payload);
  delete scanner;
}

}