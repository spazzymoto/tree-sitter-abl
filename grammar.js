const fs = require("fs");
fs.writeFileSync("keyword.txt", "");
const knownKeywords = [];

const PREC = {
  ASSIGN: 1,
  IF: 2,
  OR: 3,
  AND: 4,
  NOT: 5,
  REL: 6,
  ADD: 7,
  MULT: 8,
  UNARY: 9,
  SCOPED: 10,
};

module.exports = grammar({
  name: "abl",

  externals: $ => [
    $._end_of_statement,
    $._dot,
    $._statement_colon,
    $._colon,
    $.character,
    $.preprocessor,
    $.block_comment,
  ],

  extras: $ => [
    $.preprocessor,
    $.line_comment,
    $.block_comment,
    // $._preprocessor,
    /\s|\r?\n/,
  ],

  conflicts: $ => [
    [$.export_statement, $.primary_expression],
    [$.import_statement, $.primary_expression],
    [$.builtin_function, $._keyword_function, $.system_handle_attribute],
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat(choice($.preprocessor_directive, $._statement)),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_-]*/,
    scoped_identifier: $ =>
      prec.right(
        PREC.SCOPED,
        seq(
          choice($.preprocessor, $.identifier),
          $._dot,
          sep1(choice($.preprocessor, $.identifier, "*"), $._dot),
        ),
      ),

    line_comment: _ => seq("//", /[^\n]*/),

    //
    // Preprocessor
    //
    preprocessor_directive: $ => choice($._pp_if, $._pp_else, $._pp_end),

    _pp_if: $ => seq(choice(kw("&IF"), kw("&ELSEIF")), /.+/, kw("&THEN")),

    _pp_else: $ => kw("&ELSE"),
    _pp_end: $ => kw("&ENDIF"),

    //
    // Literals
    //

    _literal: $ =>
      choice(
        $.integer,
        $.decimal,
        $._character,
        kw("TRUE"),
        kw("FALSE"),
        kw("YES"),
        kw("NO"),
        "?",
      ),

    //
    // Primitive types
    //

    //
    // Types
    //

    primitive_type: $ =>
      choice(
        kw("BLOB"),
        kw("CHARACTER"),
        kw("CLOB"),
        kw("COM-HANDLE"),
        kw("DATE"),
        kw("DATETIME"),
        kw("DATETIME-TZ"),
        kw("DECIMAL"),
        kw("HANDLE"),
        kw("INT64"),
        kw("INTEGER"),
        kw("LOGICAL"),
        kw("LONGCHAR"),
        kw("MEMPTR"),
        kw("RAW"),
        kw("RECID"),
        kw("ROWID"),
        kw("WIDGET-HANDLE"),
      ),

    integer: $ => /[0-9]+/,
    decimal: $ => /[0-9]+\.[0-9]+/,
    character_modifier: $ => seq($._colon, choice("U")),
    _character: $ =>
      prec.right(seq($.character, optional($.character_modifier))),

    //
    // Expressions
    //

    expression: $ =>
      choice(
        $.binary_expression,
        $.if_expression,
        $.primary_expression,
        $.unary_expression,
      ),

    assignment_expression: $ =>
      prec.right(
        PREC.ASSIGN,
        seq(
          field(
            "left",
            choice(
              $.identifier,
              $.scoped_identifier,
              $.field_access,
              $.array_access,
              seq(
                field("name", $._statement_function),
                field("arguments", $.arguments),
              ),
            ),
          ),
          choice("=", "+=", "-=", "*=", "/="),
          field("right", $.expression),
        ),
      ),

    binary_expression: $ =>
      choice(
        ...[
          [kw("OR"), PREC.OR],
          [kw("XOR"), PREC.OR],
          [kw("AND"), PREC.AND],

          ["=", PREC.REL],
          ["<>", PREC.REL],
          [">", PREC.REL],
          ["<", PREC.REL],
          [">=", PREC.REL],
          ["<=", PREC.REL],
          [kw("EQ"), PREC.REL],
          [kw("NE"), PREC.REL],
          [kw("LT"), PREC.REL],
          [kw("GT"), PREC.REL],
          [kw("LE"), PREC.REL],
          [kw("GE"), PREC.REL],
          [kw("BEGINS"), PREC.REL],
          [kw("MATCHES"), PREC.REL],

          ["*", PREC.MULT],
          ["/", PREC.MULT],
          [kw("MODULO"), PREC.MULT],

          ["+", PREC.ADD],
          ["-", PREC.ADD],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(
              field("left", $.expression),
              field("operator", operator),
              field("right", $.expression),
            ),
          ),
        ),
      ),

    if_expression: $ =>
      prec.right(
        PREC.IF,
        seq(
          kw("IF"),
          field("condition", $.expression),
          kw("THEN"),
          field("consequence", $.expression),
          kw("ELSE"),
          field("alternative", $.expression),
        ),
      ),

    primary_expression: $ =>
      prec.right(
        choice(
          $._literal,
          $.identifier,
          // $.scoped_identifier,
          $.parenthesized_expression,
          $.field_access,
          $.array_access,
          $.call_expression,
          $.new_expression,
          $.builtin_function,
          $.system_handle,
          $.system_handle_attribute,
        ),
      ),

    unary_expression: $ =>
      choice(
        ...[
          ["+", PREC.UNARY],
          ["-", PREC.UNARY],
          [kw("NOT"), PREC.NOT],

          // hack? :)
          [kw("BUFFER"), PREC.UNARY],
          [kw("DATASET"), PREC.UNARY],
          [kw("TEMP-TABLE"), PREC.UNARY],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(field("operator", operator), field("operand", $.expression)),
          ),
        ),
      ),

    parenthesized_expression: $ => seq("(", $.expression, ")"),

    array_access: $ =>
      prec.right(
        PREC.SCOPED,
        seq(
          field("array", $.primary_expression),
          "[",
          field("index", $.expression),
          "]",
        ),
      ),

    field_access: $ =>
      prec.right(
        PREC.SCOPED,
        seq(
          field("object", $.primary_expression),
          $._colon,
          field("field", $.expression),
        ),
      ),

    call_expression: $ =>
      prec.right(
        PREC.SCOPED,
        seq(
          field("name", $.primary_expression),
          field("arguments", $.arguments),
        ),
      ),

    new_expression: $ =>
      prec.right(
        PREC.SCOPED,
        seq(kw("NEW"), choice($.identifier, $.scoped_identifier), $.arguments),
      ),

    // TODO: HERE
    temp_table_expression: $ => seq(kw("TEMP-TABLE"), $.identifier, choice()),

    arguments: $ =>
      seq(
        "(",
        commaSep(
          seq(
            optional(choice(kw("INPUT"), kw("INPUT-OUTPUT"), kw("OUTPUT"))),
            $.expression,
          ),
        ),
        ")",
      ),

    _statement_function: $ =>
      choice(
        kw("ENTRY"),
        kw("DYNAMIC-CURRENT-VALUE"),
        kw("EXTENT"),
        kw("FIX-CODEPAGE"),
        kw("LENGTH"),
        kw("OVERLAY"),
        kw("PUT-BITS"),
        kw("PUT-BYTE"),
        kw("PUT-BYTES"),
        kw("PUT-DOUBLE"),
        kw("PUT-FLOAT"),
        kw("PUT-INT64"),
        kw("PUT-LONG"),
        kw("PUT-SHORT"),
        kw("PUT-STRING"),
        kw("PUT-UNSIGNED-LONG"),
        kw("PUT-UNSIGNED-SHORT"),
        kw("RAW"),
      ),

    _keyword_function: $ =>
      choice(
        prec.right(seq(kw("AMBIGUOUS"), optional($.identifier))),
        prec.right(seq(kw("AVAILABLE"), optional($.identifier))),
        prec.right(seq(kw("CURRENT-CHANGED"), optional($.identifier))),
        kw("ETIME"),
        kw("GENERATE-PBE-SALT "),
        kw("GENERATE-RANDOM-KEY"),
        kw("GENERATE-UUID"),
        kw("GET-CODEPAGES"),
        kw("GUID"),
        kw("LINE-COUNTER"),
        prec.right(seq(kw("LOCKED"), optional($.identifier))),
        prec.right(seq(kw("NEW"), optional($.identifier))),
        kw("NOW"),
        kw("NUM-ALIASES"),
        kw("NUM-DBS"),
        kw("OPSYS"),
        kw("OS-ERROR"),
        kw("PAGE-NUMBER"),
        kw("PAGE-SIZE"),
        kw("PROC-HANDLE"),
        kw("PROC-STATUS"),
        kw("PROCESS-ARCHITECTURE"),
        kw("PROMSGS"),
        kw("PROPATH"),
        kw("PROVERSION"),
        kw("RETRY"),
        kw("RETURN-VALUE"),
        kw("SUPER"),
        kw("TRANSACTION"),
        kw("USERID"),
      ),

    builtin_function: $ =>
      choice(
        $._statement_function,
        $._keyword_function,
        kw("ALIAS"),
        kw("ASC"),
        kw("BASE64-DECODE"),
        kw("BASE64-ENCODE"),
        kw("CAN-DO"),
        kw("CAN-QUERY"),
        kw("CAN-SET"),
        kw("CAPS"),
        kw("CAST"),
        kw("CHR"),
        kw("CODEPAGE-CONVERT"),
        kw("COMPARE"),
        kw("CONNECTED"),
        kw("CURRENT-RESULT-ROW"),
        kw("CURRENT-VALUE"),
        kw("DATA-SOURCE-MODIFIED"),
        kw("DATE"),
        kw("DATETIME"),
        kw("DATETIME-TZ"),
        kw("DAY"),
        kw("DBCODEPAGE"),
        kw("DBCOLLATION"),
        kw("DBNAME"),
        kw("DBPARAM"),
        kw("DBRESTRICTIONS"),
        kw("DBTASKID"),
        kw("DBTYPE"),
        kw("DB-REMOTE-HOST"),
        kw("DBVERSION"),
        kw("DECIMAL"),
        kw("DECRYPT"),
        kw("DYNAMIC-CAST"),
        kw("DYNAMIC-ENUM"),
        seq(
          kw("DYNAMIC-FUNCTION"),
          "(",
          $.expression,
          optional(seq(kw("IN"), $.expression)),
          optional(","),
          commaSep($.expression),
          ")",
        ),
        kw("DYNAMIC-INVOKE"),
        kw("DYNAMIC-NEW"),
        kw("DYNAMIC-NEXT-VALUE"),
        kw("DYNAMIC-PROPERTY"),
        kw("ENCODE"),
        kw("ENCRYPT"),
        kw("EXP"),
        kw("FILL"),
        kw("FIRST"),
        kw("FIRST-OF"),
        kw("GENERATE-PBE-KEY"),
        kw("GET-BITS"),
        kw("GET-BYTE"),
        kw("GET-BYTE-ORDER"),
        kw("GET-BYTES"),
        kw("GET-CLASS"),
        kw("GET-CODEPAGE"),
        kw("GET-COLLATION"),
        kw("GET-COLLATIONS"),
        kw("GET-DB-CLIENT"),
        kw("GET-DOUBLE"),
        kw("GET-EFFECTIVE-TENANT-ID"),
        kw("GET-EFFECTIVE-TENANT-NAME"),
        kw("GET-FLOAT"),
        kw("GET-INT64"),
        kw("GET-LONG"),
        kw("GET-POINTER-VALUE"),
        kw("GET-SHORT"),
        kw("GET-SIZE"),
        kw("GET-STRING"),
        kw("GET-UNSIGNED-LONG"),
        kw("GET-UNSIGNED-SHORT"),
        kw("HANDLE"),
        kw("HASH-CODE"),
        kw("HEX-DECODE"),
        kw("HEX-ENCODE"),
        kw("INDEX"),
        kw("INT64"),
        kw("INTEGER"),
        kw("INTERVAL"),
        kw("IS-CODEPAGE-FIXED"),
        kw("IS-DB-MULTI-TENANT"),
        kw("IS-LEAD-BYTE"),
        kw("ISO-DATE"),
        kw("KBLABEL"),
        kw("KEYCODE"),
        kw("KEYFUNCTION"),
        kw("KEYLABEL"),
        kw("KEYWORD"),
        kw("KEYWORD-ALL"),
        kw("LAST"),
        kw("LAST-OF"),
        kw("LC"),
        kw("LDBNAME"),
        kw("LEFT-TRIM"),
        kw("LIBRARY"),
        kw("LIST-EVENTS"),
        kw("LIST-QUERY-ATTRS"),
        kw("LIST-SET-ATTRS"),
        kw("LOG"),
        kw("LOGICAL"),
        kw("LOOKUP"),
        kw("MAXIMUM"),
        kw("MD5-DIGEST"),
        kw("MEMBER"),
        kw("MESSAGE-DIGEST"),
        kw("MINIMUM"),
        kw("MONTH"),
        kw("MTIME"),
        kw("NEXT-VALUE"),
        kw("NORMALIZE"),
        kw("NUM-ENTRIES"),
        kw("NUM-RESULTS"),
        kw("OS-GETENV"),
        kw("PDBNAME"),
        kw("PROGRAM-NAME"),
        kw("QUERY-OFF-END"),
        kw("QUOTER"),
        kw("R-INDEX"),
        kw("RANDOM"),
        kw("RECID"),
        kw("RECORD-LENGTH"),
        kw("REJECTED"),
        kw("REPLACE"),
        kw("RIGHT-TRIM"),
        kw("ROUND"),
        kw("ROW-STATE"),
        kw("ROWID"),
        kw("SEEK"),
        kw("SET-DB-CLIENT"),
        kw("SET-EFFECTIVE-TENANT"),
        kw("SET-POINTER-VALUE"),
        kw("SETUSERID"),
        kw("SHA1-DIGEST"),
        kw("SQRT"),
        kw("SSL-SERVER-NAME"),
        kw("STRING"),
        kw("SUBSTITUTE"),
        kw("SUBSTRING"),
        kw("TENANT-ID"),
        kw("TENANT-NAME"),
        kw("TENANT-NAME-TO-ID"),
        kw("TIME"),
        kw("TIMEZONE"),
        kw("TODAY"),
        kw("TO-ROWID"),
        kw("TRIM"),
        kw("TRUNCATE"),
        kw("TYPE-OF"),
        kw("UNBOX"),
        kw("VALID-EVENT"),
        kw("VALID-HANDLE"),
        kw("VALID-OBJECT"),
        kw("WEEKDAY"),
        kw("WIDGET-HANDLE"),
        kw("YEAR"),
      ),

    system_handle: $ => choice(kw("SOURCE-PROCEDURE")),

    system_handle_attribute: $ =>
      choice(
        kw("ACTIVE"),
        kw("ACTOR"),
        kw("ADM-DATA"),
        kw("AFTER-BUFFER"),
        kw("AFTER-ROWID"),
        kw("AFTER-TABLE"),
        kw("ALLOW-PREV-DESERIALIZATION"),
        kw("AMBIGUOUS"),
        kw("APPL-ALERT-BOXES"),
        kw("APPL-CONTEXT-ID"),
        kw("APPSERVER-INFO"),
        kw("APPSERVER-PASSWORD"),
        kw("APPSERVER-USERID"),
        kw("ASYNCHRONOUS"),
        kw("ASYNC-REQUEST-COUNT"),
        kw("ASYNC-REQUEST-HANDLE"),
        kw("ATTACHED-PAIRLIST"),
        kw("ATTRIBUTE-NAMES"),
        kw("AUDIT-EVENT-CONTEXT"),
        kw("AUTO-DELETE"),
        kw("AUTO-DELETE-XML"),
        kw("AUTO-SYNCHRONIZE"),
        kw("AVAILABLE"),
        kw("BASE-ADE"),
        kw("BASIC-LOGGING"),
        kw("BATCH-MODE"),
        kw("BATCH-SIZE"),
        kw("BEFORE-BUFFER"),
        kw("BEFORE-ROWID"),
        kw("BEFORE-TABLE"),
        kw("BUFFER-GROUP-ID"),
        kw("BUFFER-GROUP-NAME"),
        kw("BUFFER-HANDLE"),
        kw("BUFFER-NAME"),
        kw("BUFFER-PARTITION-ID"),
        kw("BUFFER-TENANT-ID"),
        kw("BUFFER-TENANT-NAME"),
        kw("BUFFER-VALUE"),
        kw("BYTES-READ"),
        kw("BYTES-WRITTEN"),
        kw("CACHE"),
        kw("CALL-NAME"),
        kw("CALL-TYPE"),
        kw("CANCELLED"),
        kw("CAN-CREATE"),
        kw("CAN-DELETE"),
        kw("CAN-DO-DOMAIN-SUPPORT"),
        kw("CAN-READ"),
        kw("CAN-WRITE"),
        kw("CASE-SENSITIVE"),
        kw("CHARSET"),
        kw("CHILD-BUFFER"),
        kw("CHILD-NUM"),
        kw("CLASS-TYPE"),
        kw("CLIENT-CONNECTION-ID"),
        kw("CLIENT-TTY"),
        kw("CLIENT-TYPE"),
        kw("CLIENT-WORKSTATION"),
        kw("CODEPAGE"),
        kw("COLUMN-LABEL"),
        kw("COMPLETE"),
        kw("CONFIG-NAME"),
        kw("CONTEXT-HELP-FILE"),
        kw("COVERAGE"),
        kw("CPCASE"),
        kw("CPCOLL"),
        kw("CPINTERNAL"),
        kw("CPLOG"),
        kw("CPPRINT"),
        kw("CPRCODEIN"),
        kw("CPRCODEOUT"),
        kw("CPSTREAM"),
        kw("CPTERM"),
        kw("CRC-VALUE"),
        kw("CURRENT-CHANGED"),
        kw("CURRENT-ENVIRONMENT"),
        kw("CURRENT-ITERATION"),
        kw("CURRENT-QUERY"),
        kw("CURRENT-REQUEST-INFO"),
        kw("CURRENT-RESPONSE-INFO"),
        kw("CURRENT-RESULT-ROW"),
        kw("CURRENT-WINDOW"),
        kw("DATA-ENTRY-RETURN"),
        kw("DATASET"),
        kw("DATA-SOURCE"),
        kw("DATA-SOURCE-COMPLETE-MAP"),
        kw("DATA-SOURCE-MODIFIED"),
        kw("DATA-SOURCE-ROWID"),
        kw("DATA-TYPE"),
        kw("DATE-FORMAT"),
        kw("DB-CONTEXT"),
        kw("DB-LIST"),
        kw("DBNAME"),
        kw("DB-REFERENCES"),
        kw("DEBUG-ALERT"),
        kw("DECIMALS"),
        kw("DEFAULT-BUFFER-HANDLE"),
        kw("DEFAULT-COMMIT"),
        kw("DEFAULT-STRING"),
        kw("DEFAULT-VALUE"),
        kw("DESCRIPTION"),
        kw("DIRECTORY"),
        kw("DISPLAY-TIMEZONE"),
        kw("DISPLAY-TYPE"),
        kw("DOMAIN-DESCRIPTION"),
        kw("DOMAIN-NAME"),
        kw("DOMAIN-TYPE"),
        kw("DYNAMIC"),
        kw("ENABLED"),
        kw("ENCODING"),
        kw("ENCRYPTION-SALT"),
        kw("END-USER-PROMPT"),
        kw("ENTITY-EXPANSION-LIMIT"),
        kw("ENTRY-TYPES-LIST"),
        kw("ERROR"),
        kw("ERROR-COLUMN"),
        kw("ERROR-OBJECT"),
        kw("ERROR-OBJECT-DETAIL"),
        kw("ERROR-ROW"),
        kw("ERROR-STACK-TRACE"),
        kw("ERROR-STRING"),
        kw("EVENT-GROUP-ID"),
        kw("EVENT-HANDLER"),
        kw("EVENT-HANDLER-OBJECT"),
        kw("EVENT-PROCEDURE"),
        kw("EVENT-PROCEDURE-CONTEXT"),
        kw("EXCLUSIVE-ID"),
        kw("EXECUTION-LOG"),
        kw("EXIT-CODE"),
        kw("EXTENT"),
        kw("FILE-CREATE-DATE"),
        kw("FILE-CREATE-TIME"),
        kw("FILE-MOD-DATE"),
        kw("FILE-MOD-TIME"),
        kw("FILE-NAME"),
        kw("FILE-OFFSET"),
        kw("FILE-SIZE"),
        kw("FILE-TYPE"),
        kw("FILL-MODE"),
        kw("FILL-WHERE-STRING"),
        kw("FIRST-ASYNC-REQUEST"),
        kw("FIRST-BUFFER"),
        kw("FIRST-CHILD"),
        kw("FIRST-DATASET"),
        kw("FIRST-DATA-SOURCE"),
        kw("FIRST-FORM"),
        kw("FIRST-OBJECT"),
        kw("FIRST-PROCEDURE"),
        kw("FIRST-QUERY"),
        kw("FIRST-SERVER"),
        kw("FIRST-SERVER-SOCKET"),
        kw("FIRST-SOCKET"),
        kw("FOREIGN-KEY-HIDDEN"),
        kw("FORMAT"),
        kw("FORMATTED"),
        kw("FORM-INPUT"),
        kw("FORM-LONG-INPUT"),
        kw("FORWARD-ONLY"),
        kw("FRAGMENT"),
        kw("FRAME-SPACING"),
        kw("FULL-PATHNAME"),
        kw("HANDLE"),
        kw("HANDLER"),
        kw("HAS-LOBS"),
        kw("HAS-RECORDS"),
        kw("HEIGHT-CHARS"),
        kw("HEIGHT-PIXELS"),
        kw("HELP"),
        kw("HTML-CHARSET"),
        kw("HTML-END-OF-LINE"),
        kw("HTML-END-OF-PAGE"),
        kw("HTML-FRAME-BEGIN"),
        kw("HTML-FRAME-END"),
        kw("HTML-HEADER-BEGIN"),
        kw("HTML-HEADER-END"),
        kw("HTML-TITLE-BEGIN"),
        kw("HTML-TITLE-END"),
        kw("ICFPARAMETER"),
        kw("IMMEDIATE-DISPLAY"),
        kw("INDEX-INFORMATION"),
        kw("IN-HANDLE"),
        kw("INHERIT-BGCOLOR"),
        kw("INHERIT-FGCOLOR"),
        kw("INITIAL"),
        kw("INSTANTIATING-PROCEDURE"),
        kw("INTERNAL-ENTRIES"),
        kw("IS-CLASS"),
        kw("IS-JSON"),
        kw("IS-MULTI-TENANT"),
        kw("IS-OPEN"),
        kw("IS-PARAMETER-SET"),
        kw("IS-PARTITIONED"),
        kw("IS-XML"),
        kw("KEEP-CONNECTION-OPEN"),
        kw("KEEP-SECURITY-CACHE"),
        kw("KEY"),
        kw("KEYS"),
        kw("LABEL"),
        kw("LABELS-HAVE-COLONS"),
        kw("LANGUAGES"),
        kw("LAST-ASYNC-REQUEST"),
        kw("LAST-BATCH"),
        kw("LAST-CHILD"),
        kw("LAST-FORM"),
        kw("LAST-OBJECT"),
        kw("LAST-PROCEDURE"),
        kw("LAST-SERVER"),
        kw("LAST-SERVER-SOCKET"),
        kw("LAST-SOCKET"),
        kw("LIBRARY"),
        kw("LIBRARY-CALLING-CONVENTION"),
        kw("LISTINGS"),
        kw("LITERAL-QUESTION"),
        kw("LOCAL-HOST"),
        kw("LOCAL-NAME"),
        kw("LOCAL-PORT"),
        kw("LOCAL-VERSION-INFO"),
        kw("LOCATOR-COLUMN-NUMBER"),
        kw("LOCATOR-LINE-NUMBER"),
        kw("LOCATOR-PUBLIC-ID"),
        kw("LOCATOR-SYSTEM-ID"),
        kw("LOCATOR-TYPE"),
        kw("LOCKED"),
        kw("LOG-ENTRY-TYPES"),
        kw("LOGFILE-NAME"),
        kw("LOGGING-LEVEL"),
        kw("LOGIN-EXPIRATION-TIMESTAMP"),
        kw("LOGIN-HOST"),
        kw("LOGIN-STATE"),
        kw("LOG-THRESHOLD"),
        kw("MANDATORY"),
        kw("MAXIMUM-LEVEL"),
        kw("MERGE-BY-FIELD"),
        kw("MIN-SCHEMA-MARSHAL"),
        kw("MULTI-COMPILE"),
        kw("MULTITASKING-INTERVAL"),
        kw("MUST-UNDERSTAND"),
        kw("NAME"),
        kw("NAMESPACE-PREFIX"),
        kw("NAMESPACE-URI"),
        kw("NEEDS-APPSERVER-PROMPT"),
        kw("NEEDS-PROMPT"),
        kw("NESTED"),
        kw("NEW"),
        kw("NEXT-ROWID"),
        kw("NEXT-SIBLING"),
        kw("NODE-VALUE"),
        kw("NONAMESPACE-SCHEMA-LOCATION"),
        kw("NO-SCHEMA-MARSHAL"),
        kw("NUM-BUFFERS"),
        kw("NUM-CHILD-RELATIONS"),
        kw("NUM-CHILDREN"),
        kw("NUMERIC-DECIMAL-POINT"),
        kw("NUMERIC-FORMAT"),
        kw("NUMERIC-SEPARATOR"),
        kw("NUM-FIELDS"),
        kw("NUM-HEADER-ENTRIES"),
        kw("NUM-ITEMS"),
        kw("NUM-ITERATIONS"),
        kw("NUM-LOG-FILES"),
        kw("NUM-MESSAGES"),
        kw("NUM-PARAMETERS"),
        kw("NUM-REFERENCES"),
        kw("NUM-REFERENCES"),
        kw("NUM-RELATIONS"),
        kw("NUM-RESULTS"),
        kw("NUM-SOURCE-BUFFERS"),
        kw("NUM-TOP-BUFFERS"),
        kw("OPTIONS"),
        kw("ORDINAL"),
        kw("ORIGIN-HANDLE"),
        kw("ORIGIN-ROWID"),
        kw("OWNER-DOCUMENT"),
        kw("PARAMETER"),
        kw("PARENT-BUFFER"),
        kw("PARENT-FIELDS-AFTER"),
        kw("PARENT-FIELDS-BEFORE"),
        kw("PARENT-ID-RELATION"),
        kw("PARENT-RELATION"),
        kw("PARSE-STATUS"),
        kw("PATHNAME"),
        kw("PBE-HASH-ALGORITHM"),
        kw("PBE-KEY-ROUNDS"),
        kw("PERSISTENT"),
        kw("PERSISTENT-CACHE-DISABLED"),
        kw("PERSISTENT-PROCEDURE"),
        kw("PIXELS-PER-COLUMN"),
        kw("PIXELS-PER-ROW"),
        kw("POSITION"),
        kw("PREFER-DATASET"),
        kw("PREPARED"),
        kw("PREPARE-STRING"),
        kw("PREV-SIBLING"),
        kw("PRIMARY"),
        kw("PRIMARY-PASSPHRASE"),
        kw("PRINTER-CONTROL-HANDLE"),
        kw("PRINTER-HDC"),
        kw("PRINTER-NAME"),
        kw("PRINTER-PORT"),
        kw("PRIVATE-DATA"),
        kw("PROCEDURE-NAME"),
        kw("PROCEDURE-TYPE"),
        kw("PROFILING"),
        kw("PROXY"),
        kw("PROXY-PASSWORD"),
        kw("PROXY-USERID"),
        kw("PUBLIC-ID"),
        kw("PUBLISHED-EVENTS"),
        kw("QUALIFIED-USER-ID"),
        kw("QUERY"),
        kw("QUERY-OFF-END"),
        kw("QUIT"),
        kw("READ-ONLY"),
        kw("RECID"),
        kw("RECORD-LENGTH"),
        kw("RECURSIVE"),
        kw("REJECTED"),
        kw("RELATION-FIELDS"),
        kw("RELATIONS-ACTIVE"),
        kw("REMOTE"),
        kw("REMOTE-HOST"),
        kw("REMOTE-PORT"),
        kw("REPOSITION"),
        kw("REQUEST-INFO"),
        kw("RESPONSE-INFO"),
        kw("RESTART-ROW"),
        kw("RESTART-ROWID"),
        kw("RETURN-VALUE"),
        kw("RETURN-VALUE-DATA-TYPE"),
        kw("RETURN-VALUE-DLL-TYPE"),
        kw("ROLE"),
        kw("ROLES"),
        kw("ROWID"),
        kw("ROW-STATE"),
        kw("SAVE-WHERE-STRING"),
        kw("SCHEMA-CHANGE"),
        kw("SCHEMA-LOCATION"),
        kw("SCHEMA-MARSHAL"),
        kw("SCHEMA-PATH"),
        kw("SEAL-TIMESTAMP"),
        kw("SENSITIVE"),
        kw("SERIALIZE-HIDDEN"),
        kw("SERIALIZE-NAME"),
        kw("SERVER"),
        kw("SERVER-CONNECTION-BOUND"),
        kw("SERVER-CONNECTION-BOUND-REQUEST"),
        kw("SERVER-CONNECTION-CONTEXT"),
        kw("SERVER-CONNECTION-ID"),
        kw("SERVER-OPERATING-MODE"),
        kw("SESSION-END"),
        kw("SESSION-ID"),
        kw("SIGNATURE-VALUE"),
        kw("SINGLE-RUN"),
        kw("SINGLETON"),
        kw("SKIP-DELETED-RECORD"),
        kw("SOAP-FAULT-ACTOR"),
        kw("SOAP-FAULT-CODE"),
        kw("SOAP-FAULT-DETAIL"),
        kw("SOAP-FAULT-MISUNDERSTOOD-HEADER"),
        kw("SOAP-FAULT-NODE"),
        kw("SOAP-FAULT-ROLE"),
        kw("SOAP-FAULT-STRING"),
        kw("SOAP-FAULT-SUBCODE"),
        kw("SOAP-VERSION"),
        kw("SSL-SERVER-NAME"),
        kw("STANDALONE"),
        kw("STARTUP-PARAMETERS"),
        kw("STATE-DETAIL"),
        kw("STATISTICS"),
        kw("STOP"),
        kw("STOP-OBJECT"),
        kw("STOPPED"),
        kw("STREAM"),
        kw("STRICT"),
        kw("STRICT-ENTITY-RESOLUTION"),
        kw("STRING-VALUE"),
        kw("SUBTYPE"),
        kw("SUPER-PROCEDURES"),
        kw("SUPPRESS-NAMESPACE-PROCESSING"),
        kw("SUPPRESS-WARNINGS"),
        kw("SUPPRESS-WARNINGS-LIST"),
        kw("SYMMETRIC-ENCRYPTION-AAD"),
        kw("SYMMETRIC-ENCRYPTION-ALGORITHM"),
        kw("SYMMETRIC-ENCRYPTION-IV"),
        kw("SYMMETRIC-ENCRYPTION-KEY"),
        kw("SYMMETRIC-SUPPORT"),
        kw("SYSTEM-ALERT-BOXES"),
        kw("SYSTEM-ID"),
        kw("TABLE"),
        kw("TABLE-CRC-LIST"),
        kw("TABLE-HANDLE"),
        kw("TABLE-LIST"),
        kw("TABLE-NUMBER"),
        kw("TEMP-DIRECTORY"),
        kw("THREAD-SAFE"),
        kw("THREE-D"),
        kw("TIME-SOURCE"),
        kw("TIMEZONE"),
        kw("TOOLTIPS"),
        kw("TOP-NAV-QUERY"),
        kw("TRACE-FILTER"),
        kw("TRACING"),
        kw("TRACKING-CHANGES"),
        kw("TRANSACTION"),
        kw("TRANS-INIT-PROCEDURE"),
        kw("TYPE"),
        kw("UNDO"),
        kw("UNIQUE-ID"),
        kw("URL"),
        kw("URL-PASSWORD"),
        kw("URL-USERID"),
        kw("USER-ID"),
        kw("V6DISPLAY"),
        kw("VALIDATE-EXPRESSION"),
        kw("VALIDATE-MESSAGE"),
        kw("VALIDATE-XML"),
        kw("VALIDATION-ENABLED"),
        kw("VERSION"),
        kw("VIEW-AS"),
        kw("VISIBLE"),
        kw("WARNING"),
        kw("WC-ADMIN-APP"),
        kw("WHERE-STRING"),
        kw("WIDTH-CHARS"),
        kw("WIDTH-PIXELS"),
        kw("WINDOW-SYSTEM"),
        kw("WORK-AREA-HEIGHT-PIXELS"),
        kw("WORK-AREA-WIDTH-PIXELS"),
        kw("WORK-AREA-X"),
        kw("WORK-AREA-Y"),
        kw("WRITE-STATUS"),
        kw("XCODE-SESSION-KEY"),
        kw("X-DOCUMENT"),
        kw("XML-DATA-TYPE"),
        kw("XML-ENTITY-EXPANSION-LIMIT"),
        kw("XML-NODE-NAME"),
        kw("XML-NODE-TYPE"),
        kw("XML-SCHEMA-PATH"),
        kw("XML-STRICT-ENTITY-RESOLUTION"),
        kw("XML-SUPPRESS-NAMESPACE-PROCESSING"),
        kw("YEAR-OFFSET"),
      ),

    //
    // Statements
    //

    _statement: $ =>
      choice(
        seq(
          choice(
            $.assign_statement,

            $.block_level_statement,

            $.case_statement,
            $.catch_statement,
            // $.class_statement
            $.close_query_statement,
            $.close_stored_procedure,
            $.create_statement,
            $.create_alias_statement,
            $.create_buffer_statement,
            $.create_call_statement,
            $.create_client_principle_statement,
            $.create_database_statement,
            $.create_dataset_statement,
            $.create_datasource_statement,
            $.create_query_statement,
            $.create_saxreader_statement,
            $.create_saxwriter_statement,
            $.create_server_statement,
            $.create_saxattributes_statement,
            $.create_server_socket_statement,
            $.create_soap_header_statement,
            $.create_soap_header_entryref_statement,
            $.create_socket_statement,
            $.create_temp_table_statement,
            $.create_widget_pool_statement,
            $.create_x_document_statement,
            $.create_x_noderef_statement,

            $.define_buffer_statement,
            $.define_dataset_statement,
            $.define_stream_statement,
            $.define_temp_table_statement,
            $.define_variable_statement,
            $.delete_statement,
            $.delete_alias_statement,
            $.delete_object_statement,
            $.delete_widget_pool_statement,
            $.disable_trigger_statement,
            $.disconnect_statement,
            $.do_statement,

            $.empty_temp_table_statement,
            $.enum_statement,
            $.export_statement,
            alias(
              seq($.expression, optional(kw("NO-ERROR"))),
              $.expression_statement,
            ),

            $.finally_statement,
            $.find_statement,
            $.for_statement,
            $.function_statement,

            $.get_statement,
            $.get_key_value_statement,

            $.import_statement,
            $.input_close_statement,
            $.input_from_statement,
            $.input_through_statement,
            $.input_output_close_statement,

            $.leave_statement,
            $.load_statement,

            $.message_statement,

            $.next_statement,

            $.open_query_statement,
            $.os_append_statement,
            $.os_command_statement,
            $.os_copy_statement,
            $.os_create_dir_statement,
            $.os_delete_statement,
            $.os_rename_statement,
            $.output_close_statement,
            $.output_through_statement,
            $.output_to_statement,

            $.page_statement,
            $.pause_statement,
            $.procedure_statement,
            $.process_events_statement,
            $.publish_statement,
            $.put_statement,
            $.put_key_value_statement,

            $.quit_statement,

            $.raw_transfer_statement,
            $.release_statement,
            $.reposition_statement,
            $.return_statement,
            $.run_statement,
            $.routine_level_statement,

            $.using_statement,
            $.undo_statement,
          ),
          $._end_of_statement,
        ),
        alias($._end_of_statement, $.empty_statement),
        $.if_statement,
      ),

    assign_statement: $ =>
      seq(
        kw("ASSIGN"),
        repeat1(
          seq($.assignment_expression, optional(seq(kw("WHEN"), $.expression))),
        ),
        optional(kw("NO-ERROR")),
      ),

    block_level_statement: $ =>
      seq(
        kw("BLOCK-LEVEL"),
        kw("ON"),
        kw("ERROR"),
        kw("UNDO"),
        ",",
        kw("THROW"),
      ),

    case_statement: $ =>
      seq(
        kw("CASE"),
        $.expression,
        $._statement_colon,
        repeat1(
          seq(
            sep1(seq(kw("WHEN"), $.expression), kw("OR")),
            kw("THEN"),
            $._statement,
          ),
        ),
        kw("END"),
        optional(kw("CASE")),
      ),

    catch_statement: $ =>
      seq(
        kw("CATCH"),
        $.identifier,
        kw("AS"),
        optional(kw("CLASS")),
        $.scoped_identifier,
        $._statement_colon,
        repeat($._statement),
        kw("END"),
        optional(kw("CATCH")),
      ),

    // class_statement

    close_query_statement: $ => seq(kw("CLOSE"), kw("QUERY"), $.identifier),

    close_stored_procedure: $ =>
      seq(
        kw("CLOSE"),
        kw("STORED-PROCEDURE"),
        $.identifier,
        optional(seq($.identifier, "=", kw("PROC-STATUS"))),
        optional(seq(kw("WHERE"), kw("PROC-HANDLE"), "=", $.identifier)),
      ),

    create_statement: $ =>
      seq(
        kw("CREATE"),
        $.scoped_identifier,
        optional(seq(kw("FOR"), kw("TENANT"), $.expression)),
      ),

    create_alias_statement: $ =>
      seq(
        kw("CREATE"),
        kw("ALIAS"),
        choice($.expression, seq(kw("VALUE"), $.expression)),
        kw("FOR"),
        kw("DATABASE"),
        choice($.expression, seq(kw("VALUE"), $.expression)),
        optional(kw("NO-ERROR")),
      ),

    create_buffer_statement: $ =>
      seq(
        kw("CREATE"),
        kw("BUFFER"),
        $.identifier,
        kw("FOR"),
        kw("TABLE"),
        $.expression,
        anyOf(
          seq(kw("BUFFER-NAME"), $.expression),
          seq(kw("IN"), kw("WIDGET-POOL"), $.expression),
        ),
      ),

    create_call_statement: $ =>
      seq(
        kw("CREATE"),
        kw("CALL"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    create_client_principle_statement: $ =>
      seq(
        kw("CREATE"),
        kw("CLIENT-PRINCIPAL"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    create_database_statement: $ =>
      seq(
        kw("CREATE"),
        kw("DATABASE"),
        $.expression,
        anyOf(
          seq(kw("FROM"), $.expression, optional(kw("NEW-INSTANCE"))),
          kw("REPLACE"),
          kw("NO-ERROR"),
        ),
      ),

    create_dataset_statement: $ =>
      seq(
        kw("CREATE"),
        kw("DATASET"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    create_datasource_statement: $ =>
      seq(
        kw("CREATE"),
        kw("DATA-SOURCE"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    create_query_statement: $ =>
      seq(
        kw("CREATE"),
        kw("QUERY"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    create_saxreader_statement: $ =>
      seq(
        kw("CREATE"),
        kw("SAX-READER"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
        optional(kw("NO-ERROR")),
      ),

    create_saxwriter_statement: $ =>
      seq(
        kw("CREATE"),
        kw("SAX-WRITER"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
        optional(kw("NO-ERROR")),
      ),

    create_server_statement: $ =>
      seq(
        kw("CREATE"),
        kw("SERVER"),
        $.identifier,
        optional(seq(kw("ASSIGN"), repeat1($.assignment_expression))),
      ),

    create_saxattributes_statement: $ =>
      seq(
        kw("CREATE"),
        kw("SAX-ATTRIBUTES"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
        optional(kw("NO-ERROR")),
      ),

    create_server_socket_statement: $ =>
      seq(
        kw("CREATE"),
        kw("SERVER-SOCKET"),
        $.identifier,
        optional(kw("NO-ERROR")),
      ),

    create_soap_header_statement: $ =>
      seq(
        kw("CREATE"),
        kw("SOAP-HEADER"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    create_soap_header_entryref_statement: $ =>
      seq(
        kw("CREATE"),
        kw("SOAP-HEADER-ENTRYREF"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    create_socket_statement: $ =>
      seq(kw("CREATE"), kw("SOCKET"), $.identifier, optional(kw("NO-ERROR"))),

    create_temp_table_statement: $ =>
      seq(
        kw("CREATE"),
        kw("TEMP-TABLE"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    create_widget_pool_statement: $ =>
      seq(
        kw("CREATE"),
        kw("WIDGET-POOL"),
        optional(seq($.identifier, optional("PERSISTENT"))),
        optional(kw("NO-ERROR")),
      ),

    create_x_document_statement: $ =>
      seq(
        kw("CREATE"),
        kw("X-DOCUMENT"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    create_x_noderef_statement: $ =>
      seq(
        kw("CREATE"),
        kw("X-NODEREF"),
        $.identifier,
        optional(seq(kw("IN"), kw("WIDGET-POOL"), $.expression)),
      ),

    _define_statement: $ =>
      seq(
        kw("DEFINE"),
        anyOf(
          seq(optional(seq(kw("NEW"), optional(kw("GLOBAL")))), kw("SHARED")),
          choice(
            kw("PRIVATE"),
            kw("PACKAGE-PRIVATE"),
            kw("PROTECTED"),
            kw("PACKAGE-PROTECTED"),
            kw("PUBLIC"),
          ),
          kw("STATIC"),
          choice(kw("SERIALIZABLE"), kw("NON-SERIALIZABLE")),
        ),
      ),

    define_buffer_statement: $ =>
      seq(
        $._define_statement,
        kw("BUFFER"),
        $.identifier,
        kw("FOR"),
        optional(kw("TEMP-TABLE")),
        $.scoped_identifier,
        anyOf(
          kw("PRESELECT"),
          seq(kw("LABEL"), $.expression),
          seq(kw("NAMESPACE-URI"), $.expression),
          seq(kw("NAMESPACE-PREFIX"), $.expression),
          seq(kw("XML-NODE-NAME"), $.expression),
          seq(kw("SERIALIZE-NAME"), $.expression),
        ),
      ),

    define_dataset_statement: $ =>
      seq(
        $._define_statement,
        kw("DATASET"),
        $.identifier,
        anyOf(
          seq(kw("NAMESPACE-URI"), $.character),
          seq(kw("NAMESPACE-PREFIX"), $.character),
          seq(kw("XML-NODE-NAME"), $.character),
          seq(kw("SERIALIZE-NAME"), $.character),
          seq(kw("XML-NODE-TYPE"), $.character),
          kw("SERIALIZE-HIDDEN"),
          kw("REFERENCE-ONLY"),
        ),
        kw("FOR"),
        commaSep1($.identifier),
        repeat1(
          choice(
            seq(
              kw("DATA-RELATION"),
              optional($.identifier),
              kw("FOR"),
              $.identifier,
              ",",
              $.identifier,
              kw("RELATION-FIELDS"),
              "(",
              commaSep1($.identifier),
              ")",
              anyOf(
                kw("REPOSITION"),
                kw("NESTED"),
                kw("FOREIGN-KEY-HIDDEN"),
                kw("NOT-ACTIVE"),
                kw("RECURSIVE"),
              ),
            ),
            seq(
              kw("PARENT-ID-RELATION"),
              optional($.identifier),
              kw("FOR"),
              $.identifier,
              ",",
              $.identifier,
              kw("PARENT-ID-FIELD"),
              $.identifier,
              optional(
                seq(
                  kw("PARENT-FIELDS-BEFORE"),
                  "(",
                  commaSep1($.identifier),
                  ")",
                ),
              ),
              optional(
                seq(
                  kw("PARENT-FIELDS-AFTER"),
                  "(",
                  commaSep1($.identifier),
                  ")",
                ),
              ),
            ),
          ),
        ),
      ),

    define_stream_statement: $ =>
      seq($._define_statement, kw("STREAM"), $.identifier),

    define_temp_table_statement: $ =>
      seq(
        $._define_statement,
        kw("TEMP-TABLE"),
        $.identifier,
        anyOf(
          kw("NO-UNDO"),
          seq(kw("NAMESPACE-URI"), $.character),
          seq(kw("NAMESPACE-PREFIX"), $.character),
          seq(kw("XML-NODE-NAME"), $.character),
          seq(kw("SERIALIZE-NAME"), $.character),
          kw("REFERENCE-ONLY"),
          seq(
            choice(kw("LIKE"), kw("LIKE-SEQUENTIAL")),
            $.scoped_identifier,
            anyOf(
              kw("VALIDATE"),
              seq(
                kw("USE-INDEX"),
                $.identifier,
                optional(seq(kw("AS"), kw("PRIMARY"))),
              ),
            ),
          ),
          kw("RCODE-INFORMATION"),
          seq(kw("BEFORE-TABLE"), $.identifier),
        ),
        repeat($.field_definition),
        repeat($.index_definition),
      ),

    field_definition: $ =>
      seq(
        kw("FIELD"),
        $.identifier,
        choice(
          seq(kw("AS"), $.datatype),
          seq(kw("LIKE"), $.identifier, optional(kw("VALIDATE"))),
        ),
        anyOf(
          seq(kw("COLUMN-LABEL"), $.character),
          seq(kw("DECIMALS"), $.integer),
          seq(kw("EXTENT"), $.integer),
          seq(kw("FORMAT"), $.character),
          seq(kw("HELP"), $.character),
          seq(kw("INITIAL"), commaSep1($._literal)),
          seq(kw("LABEL"), commaSep1($.character)),
          seq(optional(kw("NOT")), kw("CASE-SENSITIVE")),
          kw("SERIALIZE-HIDDEN"),
          seq(kw("SERIALIZE-NAME"), $.character),
          seq(choice(kw("TTCODEPAGE"), kw("COLUMN-CODEPAGE")), $.character),
          seq(kw("XML-DATA-TYPE"), $.character),
          seq(kw("XML-NODE-TYPE"), $.character),
          seq(kw("XML-NODE-NAME"), $.character),
        ),
      ),

    index_definition: $ =>
      seq(
        kw("INDEX"),
        $.identifier,
        anyOf(
          choice(kw("AS"), kw("IS")),
          kw("UNIQUE"),
          kw("PRIMARY"),
          kw("WORD-INDEX"),
        ),
        repeat1(
          seq(
            $.identifier,
            optional(choice(kw("ASCENDING"), kw("DESCENDING"))),
          ),
        ),
      ),

    define_variable_statement: $ =>
      seq(
        $._define_statement,
        kw("VARIABLE"),
        $.identifier,
        choice(seq(kw("AS"), $.datatype), seq(kw("LIKE"), $.identifier)),
        optional(seq(kw("EXTENT"), optional($.integer))),
        anyOf(
          seq(kw("SERIALIZE-NAME"), $.character),
          seq(kw("COLUMN-LABEL"), $.character),
          seq(kw("DECIMALS"), $.integer),
          seq(kw("FORMAT"), $.character),
          seq(kw("INITIAL"), commaSep1($._literal)),
          seq(kw("LABEL"), commaSep1($.character)),
          kw("NO-UNDO"),
          seq(optional(kw("NOT")), kw("CASE-SENSITIVE")),
        ),
      ),

    delete_statement: $ =>
      seq(
        kw("DELETE"),
        $.scoped_identifier,
        optional(seq(kw("VALIDATE"), "(", $.expression, $.expression, ")")),
        optional(kw("NO-ERROR")),
      ),

    delete_alias_statement: $ =>
      seq(
        kw("DELETE"),
        kw("ALIAS"),
        choice($.identifier, seq(kw("VALUE"), "(", $.expression, ")")),
      ),

    delete_object_statement: $ =>
      seq(kw("DELETE"), kw("OBJECT"), $.identifier, optional(kw("NO-ERROR"))),

    delete_widget_pool_statement: $ =>
      seq(
        kw("DELETE"),
        kw("WIDGET-POOL"),
        $.identifier,
        optional(kw("NO-ERROR")),
      ),

    disable_trigger_statement: $ =>
      seq(
        kw("DISABLE"),
        kw("TRIGGERS"),
        kw("FOR"),
        choice(kw("DUMP"), kw("LOAD")),
        kw("OF"),
        $.identifier,
        optional(kw("ALLOW-REPLICATION")),
      ),

    disconnect_statement: $ =>
      seq(
        kw("DISCONNECT"),
        choice($.identifier, seq(kw("VALUE"), "(", $.expression, ")")),
        optional(kw("NO-ERROR")),
      ),

    do_statement: $ =>
      seq(
        optional(seq($.identifier, $._statement_colon)),
        kw("DO"),
        anyOf(
          seq(kw("FOR"), commaSep1($.scoped_identifier)),
          $.preselect_phrase,
          $.query_tuning_phrase,
          seq(
            $.identifier,
            "=",
            $.expression,
            kw("TO"),
            $.expression,
            optional(seq(kw("BY"), $.integer)),
          ),
          seq(kw("WHILE"), $.expression),
          kw("TRANSACTION"),
          $.on_error_phrase,
          $.on_quit_phrase,
          $.on_stop_phrase,
        ),
        $._statement_colon,
        repeat($._statement),
        kw("END"),
      ),

    empty_temp_table_statement: $ =>
      seq(
        kw("EMPTY"),
        kw("TEMP-TABLE"),
        $.identifier,
        optional(kw("NO-ERROR")),
      ),

    enum_statement: $ =>
      seq(
        kw("ENUM"),
        $.scoped_identifier,
        optional(kw("FLAGS")),
        $._statement_colon,
        kw("DEFINE"),
        kw("ENUM"),
        $.enum_member_definition,
        repeat($.enum_member_definition),
        $._end_of_statement,
        kw("END"),
        optional(kw("ENUM")),
      ),

    enum_member_definition: $ =>
      seq(
        $.identifier,
        optional(seq("=", choice(commaSep1($.identifier), $._literal))),
      ),

    export_statement: $ =>
      seq(
        kw("EXPORT"),
        optional(
          choice(
            seq(kw("STREAM"), $.identifier),
            seq(kw("STREAM-HANDLE"), $.identifier),
          ),
        ),
        optional(seq(kw("DELIMITER"), $.expression)),
        choice(
          repeat1($.expression),
          seq(
            $.scoped_identifier,
            optional(seq(kw("EXCEPT"), repeat1($.scoped_identifier))),
          ),
        ),
        optional(kw("NO-LOBS")),
      ),

    finally_statement: $ =>
      seq(
        kw("FINALLY"),
        $._statement_colon,
        repeat($._statement),
        kw("END"),
        optional(kw("FINALLY")),
      ),

    find_statement: $ =>
      seq(
        kw("FIND"),
        choice(
          seq(
            optional(choice(kw("FIRST"), kw("LAST"), kw("NEXT"), kw("PREV"))),
            $.record_phrase,
          ),
          seq(
            kw("CURRENT"),
            $.scoped_identifier,
            optional(
              choice(kw("SHARE-LOCK"), kw("EXCLUSIVE-LOCK"), kw("NO-LOCK")),
            ),
          ),
        ),
        optional(kw("NO-WAIT")),
        optional(kw("NO-ERROR")),
      ),

    for_statement: $ =>
      seq(
        optional(seq($.identifier, $._statement_colon)),
        kw("FOR"),
        choice(
          seq(
            commaSep1(
              seq(choice(kw("EACH"), kw("FIRST"), kw("LAST")), $.record_phrase),
            ),
            anyOf(
              $.query_tuning_phrase,
              kw("BREAK"),
              seq(kw("BY"), $.scoped_identifier, optional(kw("DESCENDING"))),
            ),
          ),
          seq(
            $.identifier,
            "=",
            $.expression,
            kw("TO"),
            $.expression,
            optional(seq(kw("BY"), $.integer)),
          ),
          seq(kw("WHILE"), $.expression),
        ),
        anyOf(
          kw("TRANSACTION"),
          $.on_error_phrase,
          $.on_quit_phrase,
          $.on_stop_phrase,
        ),
        $._statement_colon,
        repeat($._statement),
        kw("END"),
      ),

    function_statement: $ =>
      seq(
        kw("FUNCTION"),
        $.identifier,
        optional(kw("RETURNS")),
        $.datatype,
        optional(kw("PRIVATE")),
        optional(seq("(", commaSep($.parameter_definition), ")")),
        choice(
          seq(
            $._statement_colon,
            repeat($._statement),
            kw("END"),
            optional("FUNCTION"),
          ),
          seq(kw("FORWARD")),
          seq(
            optional(seq(kw("MAP"), optional(kw("TO")), $.identifier)),
            kw("IN"),
            $.identifier,
          ),
          seq(kw("IN"), kw("SUPER")),
        ),
      ),

    get_statement: $ =>
      seq(
        kw("GET"),
        choice(kw("FIRST"), kw("NEXT"), kw("PREV"), kw("LAST"), kw("CURRENT")),
        $.identifier,
        anyOf(
          choice(kw("SHARE-LOCK"), kw("EXCLUSIVE-LOCK"), kw("NO-LOCK")),
          kw("NO-WAIT"),
        ),
      ),

    get_key_value_statement: $ =>
      seq(
        kw("GET-KEY-VALUE"),
        kw("SECTION"),
        $.identifier,
        kw("KEY"),
        choice($.identifier, kw("DEFAULT")),
        kw("VALUE"),
        $.identifier,
      ),

    if_statement: $ =>
      prec.right(
        seq(
          kw("IF"),
          $.expression,
          kw("THEN"),
          $._statement,
          optional(seq(kw("ELSE"), $._statement)),
        ),
      ),

    import_statement: $ =>
      seq(
        kw("IMPORT"),
        optional(
          choice(
            seq(kw("STREAM"), $.identifier),
            seq(kw("STREAM-HANDLE"), $.identifier),
          ),
        ),
        choice(
          seq(
            optional(seq(kw("DELIMITER"), $.expression)),
            repeat1(choice($.expression, "^")),
          ),
          seq(
            $.scoped_identifier,
            optional(seq(kw("EXCEPT"), repeat1($.scoped_identifier))),
          ),
          seq(kw("UNFORMATTED"), $.expression),
        ),
        optional(kw("NO-LOBS")),
        optional(kw("NO-ERROR")),
      ),

    _input_statement: $ =>
      seq(
        kw("INPUT"),
        optional(seq(choice(kw("STREAM"), kw("STREAM-HANDLE")), $.identifier)),
      ),

    input_close_statement: $ => seq($._input_statement, kw("CLOSE")),

    input_from_statement: $ =>
      seq(
        $._input_statement,
        kw("FROM"),
        choice(
          // opsys-file
          // opsys_device
          kw("TERMINAL"),
          seq(kw("VALUE"), "(", $.expression, ")"),
          seq(
            kw("OS-DIR"),
            "(",
            $.expression,
            ")",
            optional(kw("NO-ATTR-LIST")),
          ),
        ),
        anyOf(
          seq(
            kw("LOB-DIR"),
            choice($.identifier, seq(kw("VALUE"), "(", $.expression, ")")),
          ),
          kw("BINARY"),
          choice(kw("ECHO"), kw("NO-ECHO")),
          choice(seq(kw("MAP"), $.identifier), kw("NO-MAP")),
          kw("UNBUFFERED"),
          choice(
            kw("NO-CONVERT"),
            seq(
              kw("CONVERT"),
              anyOf(seq(choice(kw("TARGET"), kw("SOURCE")), $.expression)),
            ),
          ),
        ),
      ),

    input_through_statement: $ =>
      seq(
        $._input_statement,
        kw("THROUGH"),
        choice(
          // program-name
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
        repeat(
          choice(
            // argument,
            seq(kw("VALUE"), "(", $.expression, ")"),
          ),
        ),
        anyOf(
          choice(kw("ECHO"), kw("NO-ECHO")),
          choice(seq(kw("MAP"), $.identifier), kw("NO-MAP")),
          kw("UNBUFFERED"),
          choice(
            kw("NO-CONVERT"),
            seq(
              kw("CONVERT"),
              anyOf(seq(choice(kw("TARGET"), kw("SOURCE")), $.expression)),
            ),
          ),
        ),
      ),

    _input_output_statement: $ =>
      seq(
        kw("INPUT-OUTPUT"),
        optional(seq(choice(kw("STREAM"), kw("STREAM-HANDLE")), $.identifier)),
      ),

    input_output_close_statement: $ =>
      seq($._input_output_statement, kw("CLOSE")),

    input_output_through_statement: $ =>
      seq(
        $._input_output_statement,
        kw("THROUGH"),
        choice(
          // program-name
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
        repeat(
          choice(
            // argument,
            seq(kw("VALUE"), "(", $.expression, ")"),
          ),
        ),
        anyOf(
          choice(kw("ECHO"), kw("NO-ECHO")),
          choice(seq(kw("MAP"), $.identifier), kw("NO-MAP")),
          kw("UNBUFFERED"),
          choice(
            kw("NO-CONVERT"),
            seq(
              kw("CONVERT"),
              anyOf(seq(choice(kw("TARGET"), kw("SOURCE")), $.expression)),
            ),
          ),
        ),
      ),

    leave_statement: $ => seq(kw("LEAVE"), optional($.identifier)),

    load_statement: $ =>
      seq(
        kw("LOAD"),
        $.expression,
        anyOf(
          seq(kw("DIR"), $.expression),
          kw("APPLICATION"),
          kw("NEW"),
          seq(kw("BASE-KEY"), $.expression),
          kw("NO-ERROR"),
        ),
      ),

    message_statement: $ =>
      seq(
        kw("MESSAGE"),
        repeat($.expression),
        anyOf(
          kw("SKIP"),
          seq(
            kw("VIEW-AS"),
            kw("ALERT-BOX"),
            optional(
              choice(
                kw("MESSAGE"),
                kw("QUESTION"),
                kw("INFORMATION"),
                kw("ERROR"),
                kw("WARNING"),
              ),
            ),
          ),
        ),
      ),

    next_statement: $ => seq(kw("NEXT"), optional($.identifier)),

    open_query_statement: $ =>
      seq(
        kw("OPEN"),
        kw("QUERY"),
        $.identifier,
        seq(choice(kw("FOR"), kw("PRESELECT"))),
        commaSep1(
          seq(choice(kw("EACH"), kw("FIRST"), kw("LAST")), $.record_phrase),
        ),
        anyOf(
          $.query_tuning_phrase,
          kw("BREAK"),
          seq(kw("BY"), $.scoped_identifier, optional(kw("DESCENDING"))),
          kw("INDEXED-REPOSITION "),
          seq(kw("MAX-ROWS"), $.integer),
        ),
      ),

    os_append_statement: $ =>
      seq(
        kw("OS-APPEND"),
        choice(
          // source-filename
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
        choice(
          // target-filename
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
      ),

    os_command_statement: $ =>
      seq(
        kw("OS-COMMAND"),
        optional(choice(kw("SILENT"), kw("NO-WAIT"), kw("NO-CONSOLE"))),
        repeat1(
          choice(
            // command-token
            seq(kw("VALUE"), "(", $.expression, ")"),
          ),
        ),
      ),

    os_copy_statement: $ =>
      seq(
        kw("OS-COPY"),
        choice(
          // source-filename
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
        choice(
          // target-filename
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
      ),

    os_create_dir_statement: $ =>
      seq(
        kw("OS-CREATE-DIR"),
        repeat1(
          choice(
            // dirname
            seq(kw("VALUE"), "(", $.expression, ")"),
          ),
        ),
      ),

    os_delete_statement: $ =>
      seq(
        kw("OS-DELETE"),
        repeat1(
          choice(
            // filename
            seq(kw("VALUE"), "(", $.expression, ")"),
          ),
        ),
        optional(kw("RECURSIVE")),
      ),

    os_rename_statement: $ =>
      seq(
        kw("OS-RENAME"),
        choice(
          // source-filename
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
        choice(
          // target-filename
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
      ),

    _output_statement: $ =>
      seq(
        kw("OUTPUT"),
        optional(seq(choice(kw("STREAM"), kw("STREAM-HANDLE")), $.identifier)),
      ),

    output_close_statement: $ => seq($._output_statement, kw("CLOSE")),

    output_through_statement: $ =>
      seq(
        $._output_statement,
        kw("THROUGH"),
        choice(
          // program-name
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
        repeat(
          choice(
            // argument,
            seq(kw("VALUE"), "(", $.expression, ")"),
          ),
        ),
        anyOf(
          choice(kw("ECHO"), kw("NO-ECHO")),
          choice(seq(kw("MAP"), $.identifier), kw("NO-MAP")),
          kw("PAGED"),
          seq(
            kw("PAGE-SIZE"),
            choice($.integer, seq(kw("VALUE"), "(", $.expression, ")")),
          ),
          kw("UNBUFFERED"),
          choice(
            kw("NO-CONVERT"),
            seq(
              kw("CONVERT"),
              anyOf(seq(choice(kw("TARGET"), kw("SOURCE")), $.expression)),
            ),
          ),
        ),
      ),

    output_to_statement: $ =>
      seq(
        $._output_statement,
        kw("TO"),
        choice(
          seq(kw("PRINTER"), $.identifier),
          // opsys-file
          // opsys_device
          kw("TERMINAL"),
          seq(kw("VALUE"), "(", $.expression, ")"),
          $.character, // "CLIPBOARD"
        ),
        anyOf(
          seq(
            kw("LOB-DIR"),
            choice($.identifier, seq(kw("VALUE"), "(", $.expression, ")")),
          ),
          seq(
            kw("NUM-COPIES"),
            choice($.integer, seq(kw("VALUE"), "(", $.expression, ")")),
          ),
          kw("COLLATE"),
          choice(kw("LANDSCAPE"), kw("PORTRAIT")),
          kw("APPEND"),
          kw("BINARY"),
          choice(kw("ECHO"), kw("NO-ECHO")),
          kw("KEEP-MESSAGES"),
          choice(seq(kw("MAP"), $.identifier), kw("NO-MAP")),
          kw("PAGED"),
          seq(
            kw("PAGE-SIZE"),
            choice($.integer, seq(kw("VALUE"), "(", $.expression, ")")),
          ),
          kw("UNBUFFERED"),
          choice(
            kw("NO-CONVERT"),
            seq(
              kw("CONVERT"),
              anyOf(seq(choice(kw("TARGET"), kw("SOURCE")), $.expression)),
            ),
          ),
        ),
      ),

    page_statement: $ =>
      seq(
        kw("PAGE"),
        optional(seq(choice(kw("STREAM"), kw("STREAM-HANDLE")), $.identifier)),
      ),

    pause_statement: $ =>
      seq(
        kw("PAUSE"),
        anyOf(
          $.integer,
          $.decimal,
          kw("BEFORE-HIDE"),
          choice(seq(kw("MESSAGE"), $.expression), kw("NO-MESSAGE")),
        ),
      ),

    procedure_statement: $ =>
      seq(
        kw("PROCEDURE"),
        $.identifier,
        optional(kw("PRIVATE")),
        $._statement_colon,
        repeat($._statement),
        kw("END"),
        optional(kw("PROCEDURE")),
      ),

    process_events_statement: $ => seq(kw("PROCESS"), kw("EVENTS")),

    publish_statement: $ =>
      seq(
        kw("PUBLISH"),
        $.expression,
        optional(seq(kw("FROM"), $.identifier)),
        optional($.arguments),
      ),

    put_statement: $ =>
      seq(
        kw("PUT"),
        optional(seq(choice(kw("STREAM"), kw("STREAM-HANDLE")), $.identifier)),
        optional(kw("UNFORMATTED")),
        anyOf(
          seq(
            $.expression,
            anyOf(
              seq(kw("FORMAT"), $.expression),
              seq(choice(kw("AT"), kw("TO")), $.expression),
            ),
          ),
          seq(kw("SKIP"), optional(seq("(", $.expression, ")"))),
          seq(kw("SPACE"), optional(seq("(", $.expression, ")"))),
        ),
      ),

    put_key_value_statement: $ =>
      seq(
        kw("PUT-KEY-VALUE"),
        kw("SECTION"),
        $.expression,
        kw("KEY"),
        choice($.expression, kw("DEFAULT")),
        kw("VALUE"),
        $.expression,
        optional("NO-ERROR"),
      ),

    quit_statement: $ => kw("QUIT"),

    raw_transfer_statement: $ =>
      seq(
        kw("RAW-TRANSFER"),
        optional(choice(kw("BUFFER"), kw("FIELD"))),
        $.scoped_identifier,
        kw("TO"),
        optional(choice(kw("BUFFER"), kw("FIELD"))),
        $.scoped_identifier,
        optional(kw("NO-ERROR")),
      ),

    release_statement: $ =>
      seq(
        kw("RELEASE"),
        choice(
          $.scoped_identifier,
          seq(kw("EXTERNAL"), optional(kw("PROCEDURE")), $.character),
          seq(kw("OBJECT"), $.identifier),
        ),
        optional("NO-ERROR"),
      ),

    reposition_statement: $ =>
      seq(
        kw("REPOSITION"),
        $.identifier,
        choice(
          seq(
            kw("TO"),
            choice(
              seq(
                kw("ROWID"),
                commaSep1($.expression),
                optional(seq(kw("FOR"), kw("TENANT"), $.expression)),
                optional(kw("NO-ERROR")),
              ),
              seq(kw("RECID"), $.expression, optional("NO-ERROR")),
              seq(kw("ROW"), $.integer),
            ),
          ),
          seq(kw("FORWARDS"), $.integer),
          seq(kw("BACKWARDS"), $.integer),
        ),
      ),

    return_statement: $ =>
      seq(
        kw("RETURN"),
        choice(seq(optional(kw("ERROR")), $.expression), kw("NO-APPLY")),
      ),

    run_statement: $ =>
      seq(
        kw("RUN"),
        choice(
          // path-name
          $.identifier,
          seq(kw("VALUE"), "(", $.expression, ")"),
        ),
        optional(
          seq(
            choice(kw("PERSISTENT"), kw("SINGLE-RUN"), kw("SINGLETON")),
            optional(seq(kw("SET"), $.identifier)),
          ),
        ),
        optional(
          seq(
            choice(kw("ON"), kw("IN")),
            optional(kw("SERVER")),
            choice($.identifier),
            anyOf(
              seq(kw("TRANSACTION"), kw("DISTINCT")),
              seq(
                kw("ASYNCHRONOUS"),
                anyOf(
                  seq(kw("SET"), $.identifier),
                  seq(
                    kw("EVENT-PROCEDURE"),
                    $.identifier,
                    optional(seq(kw("IN"), $.identifier)),
                  ),
                  seq(
                    kw("EVENT-HANDLER"),
                    $.identifier,
                    optional(seq(kw("EVENT-HANDLER-CONTEXT"), $.identifier)),
                  ),
                ),
              ),
            ),
          ),
        ),
        $.arguments,
        optional(kw("NO-ERROR")),
      ),

    routine_level_statement: $ =>
      seq(
        kw("ROUTINE-LEVEL"),
        kw("ON"),
        kw("ERROR"),
        kw("UNDO"),
        ",",
        kw("THROW"),
      ),

    using_statement: $ =>
      seq(
        kw("USING"),
        $.scoped_identifier,
        optional(seq(kw("FROM"), choice(kw("PROPATH"), kw("ASSEMBLY")))),
      ),

    undo_statement: $ =>
      seq(
        kw("UNDO"),
        optional($.identifier),
        optional(
          seq(
            ",",
            choice(
              seq(
                choice(kw("LEAVE"), kw("NEXT"), kw("RETRY")),
                optional($.identifier),
              ),
              seq(
                kw("RETURN"),
                optional(
                  choice(
                    $.expression,
                    seq(kw("ERROR"), $.expression),
                    kw("NO-APPLY"),
                  ),
                ),
              ),
              seq(kw("THROW"), $.expression),
            ),
          ),
        ),
      ),

    parameter_definition: $ =>
      seq(
        optional(choice(kw("INPUT"), kw("OUTPUT"), kw("INPUT-OUTPUT"))),
        choice(
          seq($.identifier, kw("AS"), $.datatype),
          seq(
            kw("LIKE"),
            $.scoped_identifier,
            optional(seq(kw("EXTENT"), optional($.integer))),
          ),
          seq(
            choice(
              kw("TABLE"),
              kw("TABLE-HANDLE"),
              kw("DATASET"),
              kw("DATASET-HANDLE"),
            ),
            $.identifier,
            anyOf(kw("APPEND"), kw("BIND"), kw("BY-VALUE")),
          ),
        ),
      ),

    datatype: $ =>
      seq(
        choice(
          $.primitive_type,
          seq(optional(kw("CLASS")), $.scoped_identifier),
        ),
      ),

    //
    // Phrases
    //

    on_error_phrase: $ =>
      prec.right(
        seq(
          kw("ON"),
          kw("ERROR"),
          kw("UNDO"),
          optional($.identifier),
          optional(
            seq(
              ",",
              choice(
                kw("THROW"),
                seq(
                  choice(kw("LEAVE"), kw("NEXT"), kw("RETRY")),
                  optional($.identifier),
                ),
                seq(
                  kw("RETURN"),
                  optional(
                    choice(
                      $.expression,
                      seq(kw("ERROR"), $.expression),
                      kw("NO-APPLY"),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),

    on_quit_phrase: $ =>
      prec.right(
        seq(
          kw("ON"),
          kw("QUIT"),
          optional(seq(kw("UNDO"), optional($.identifier))),
          optional(
            seq(
              ",",
              choice(
                seq(
                  choice(kw("LEAVE"), kw("NEXT"), kw("RETRY")),
                  optional($.identifier),
                ),
                seq(
                  kw("RETURN"),
                  optional(
                    choice(
                      $.expression,
                      seq(kw("ERROR"), $.expression),
                      kw("NO-APPLY"),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),

    on_stop_phrase: $ =>
      prec.right(
        seq(
          kw("ON"),
          kw("STOP"),
          kw("UNDO"),
          optional($.identifier),
          optional(
            seq(
              ",",
              choice(
                seq(
                  choice(kw("LEAVE"), kw("NEXT"), kw("RETRY")),
                  optional($.identifier),
                ),
                seq(
                  kw("RETURN"),
                  optional(
                    choice(
                      $.expression,
                      seq(kw("ERROR"), $.expression),
                      kw("NO-APPLY"),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),

    preselect_phrase: $ =>
      seq(
        kw("PRESELECT"),
        commaSep1(
          seq(choice(kw("EACH"), kw("FIRST"), kw("LAST")), $.record_phrase),
        ),
        anyOf(
          kw("BREAK"),
          seq(kw("BY"), $.scoped_identifier, optional(kw("DESCENDING"))),
        ),
      ),

    query_tuning_phrase: $ =>
      seq(
        kw("QUERY-TUNING"),
        "(",
        anyOf(
          choice(kw("BIND-WHERE"), kw("NO-BIND-WHERE")),
          seq(kw("CACH-SIZE"), $.integer),
          choice(
            seq(kw("DEBUG"), choice(kw("SQL"), kw("EXTENDED"))),
            kw("NO-DEBUG"),
          ),
          choice(kw("INDEX-HINT"), kw("NO-INDEX-HINT")),
          choice(kw("JOIN-BY-SQLDB"), kw("NO-JOIN-BY-SQLDB")),
          choice(kw("LOOKAHEAD"), kw("NO-LOOKAHEAD")),
          choice(kw("SEPARATE-CONNECTION"), kw("NO-SEPARATE-CONNECTION")),
        ),
        ")",
      ),

    record_phrase: $ =>
      seq(
        $.scoped_identifier,
        optional(
          seq(
            choice(kw("FIELDS"), kw("EXCEPT")),
            optional(seq("(", optional(sep1($.identifier, " ")), ")")),
          ),
        ),
        anyOf(
          $._literal,
          seq(optional(kw("LEFT")), kw("OUTER-JOIN")),
          seq(kw("OF"), $.scoped_identifier),
          seq(kw("WHERE"), $.expression),
          seq(
            kw("TENANT-WHERE"),
            $.expression,
            optional(kw("SKIP-GROUP-DUPLICATES")),
          ),
          seq(choice(seq(kw("USE-INDEX"), $.identifier), kw("TABLE-SCAN"))),
          choice(kw("SHARE-LOCK"), kw("EXCLUSIVE-LOCK"), kw("NO-LOCK")),
          kw("NO-PREFETCH"),
        ),
      ),
  },
});

// Generate case insentitive match for ABL keyword
function kw(keyword) {
  if (!keyword.startsWith("&") && knownKeywords.indexOf(keyword) === -1) {
    fs.appendFileSync("keyword.txt", `  "${keyword}"\n`);

    knownKeywords.push(keyword);
  }

  if (keyword.toUpperCase() != keyword) {
    throw new Error(`Expected upper case keyword got ${keyword}`);
  }

  return alias(choice(keyword.toLowerCase(), keyword.toUpperCase()), keyword);
}

function anyOf(...rules) {
  return repeat(choice(...rules));
}

function commaSep1(rule) {
  return sep1(rule, ",");
}

function commaSep(rule) {
  return optional(sep1(rule, ","));
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
