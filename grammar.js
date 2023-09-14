const fs = require("fs");
fs.writeFileSync("keyword.txt", "");
const knownKeywords = [];

const PREC = {
  ASSIGN: 1,
  IF: 2,
  OR: 3,
  AND: 4,
  EQUALITY: 5,
  REL: 6,
  ADD: 7,
  MULT: 8,
  UNARY: 9,
  OBJ_ACCESS: 10,
};

module.exports = grammar({
  name: "abl",

  externals: $ => [
    $._end_of_statement,
    $._dot,
    $._statement_colon,
    $._colon,
    $._character_literal,
    $.preprocessor,
  ],

  extras: $ => [
    $.preprocessor,
    // $.preprocessor_directive,
    /\s|\r?\n/,
  ],

  conflicts: $ => [
    [$.reference_method, $.reference_attribute],
    [$._primary_expression, $._accumulate_function], // TODO: not sure if this is right
    [$._widget_phrase]
  ],

  rules: {
    source_file: $ => repeat($._statement),

    identifier: $ =>
      prec.right(
        PREC.OBJ_ACCESS,
        seq(
          /[_\p{XID_Start}][-_\p{XID_Continue}]*/,
          optional(
            seq(
              $._dot,
              sep1(
                choice(/[_\p{XID_Start}][-_\p{XID_Continue}]*/, "*"),
                $._dot,
              ),
            ),
          ),
        ),
      ),

    //
    // Literals
    //

    _literal: $ =>
      choice(
        $.integer_literal,
        $.decimal_literal,
        $.character_literal,
        $.unknown_literal,
        $.true,
        $.false,
      ),

    integer_literal: _ => /[0-9]+/,
    decimal_literal: _ => /[0-9]*\.[0-9]+/,
    true: _ => kw("TRUE"),
    false: _ => kw("FALSE"),
    unknown_literal: _ => "?",
    character_modifier: $ => seq($._colon, choice("U")),
    character_literal: $ =>
      prec.right(
        PREC.OBJ_ACCESS,
        seq($._character_literal, optional($.character_modifier)),
      ),

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

    //
    // Expressions
    //

    _expression: $ =>
      choice(
        $.assignment_expression,
        $.binary_expression,
        $.if_expression,
        $._primary_expression,
        $.unary_expression,
      ),

    assignment_expression: $ =>
      prec.right(
        PREC.ASSIGN,
        seq(
          choice(
            $.identifier,
            $.reference_attribute,
            $.array_access,
            $.builtin_function,
          ),
          choice("=", "+=", "-=", "*=", "/="),
          $._expression,
        ),
      ),

    binary_expression: $ =>
      choice(
        ...[
          [">", PREC.REL],
          ["<", PREC.REL],
          [">=", PREC.REL],
          ["<=", PREC.REL],
          [kw("LT"), PREC.EQUALITY],
          [kw("GT"), PREC.EQUALITY],
          [kw("LE"), PREC.EQUALITY],
          [kw("GE"), PREC.EQUALITY],

          ["=", PREC.EQUALITY],
          ["<>", PREC.EQUALITY],
          [kw("EQ"), PREC.EQUALITY],
          [kw("NE"), PREC.EQUALITY],

          [kw("AND"), PREC.AND],
          [kw("OR"), PREC.OR],

          ["+", PREC.ADD],
          ["-", PREC.ADD],

          ["*", PREC.MULT],
          ["/", PREC.MULT],
          [kw("MOD"), PREC.MULT],
        ].map(([operator, precedence]) =>
          prec.left(precedence, seq($._expression, operator, $._expression)),
        ),
      ),

    if_expression: $ =>
      prec.right(
        PREC.IF,
        seq(
          kw("IF"),
          $._expression,
          kw("THEN"),
          $._statement,
          optional(seq(kw("ELSE"), $._statement)),
        ),
      ),

    _primary_expression: $ =>
      choice(
        $._literal,
        $.identifier,
        $.system_handle,
        $.parenthesized_expression,
        $.reference_attribute,
        $.reference_method,
        $.array_access,
        $.new_object,
        $.builtin_function,
      ),

    unary_expression: $ =>
      choice(
        ...[
          ["+", PREC.UNARY],
          ["-", PREC.UNARY],
          [kw("NOT"), PREC.UNARY],
        ].map(([operator, precedence]) =>
          prec.left(precedence, seq(operator, $._expression)),
        ),
      ),

    parenthesized_expression: $ => seq("(", $._expression, ")"),

    reference_attribute: $ =>
      seq(
        $._primary_expression,
        $._colon,
        choice($.system_handle_attribute, $.identifier),
      ),

    reference_method: $ =>
      seq(
        $._primary_expression,
        $._colon,
        choice($.system_handle_method, $.identifier),
        $.argument_list,
      ),

    array_access: $ => seq($._primary_expression, "[", $._expression, "]"),

    new_object: $ => seq(kw("NEW"), $.identifier, $.argument_list),

    argument_list: $ =>
      seq(
        "(",
        commaSep(
          seq(
            optional(choice(kw("INPUT"), kw("OUTPUT"), kw("INPUT-OUTPUT"))),
            $._expression,
          ),
        ),
        ")",
      ),

    //
    // System Handles
    //

    system_handle: $ =>
      choice(
        kw("SELF"),
        kw("SESSION"),
        kw("TARGET-PROCEDURE"),
        kw("SOURCE-PROCEDURE"),
        kw("THIS-OBJECT"),
        kw("THIS-PROCEDURE"),
      ),

    system_handle_attribute: $ =>
      choice(
        // Procedure handle attributes
        kw("ADM-DATA"),
        kw("ASYNC-REQUEST-COUNT"),
        kw("CURRENT-WINDOW"),
        kw("DB-REFERENCES"),
        kw("FILE-NAME"),
        kw("HANDLE"),
        kw("INSTANTIATING-PROCEDURE"),
        kw("INTERNAL-ENTRIES"),
        kw("NAME"),
        kw("NEXT-SIBLING"),
        kw("PERSISTENT"),
        kw("PREV-SIBLING"),
        kw("PRIVATE-DATA"),
        kw("PROXY"),
        kw("PUBLISHED-EVENTS"),
        kw("REMOTE"),
        kw("SERVER"),
        kw("SUPER-PROCEDURES"),
        kw("SINGLE-RUN"),
        kw("SINGLETON"),
        kw("TRANSACTION"),
        kw("TYPE"),
        kw("UNIQUE-ID"),

        // Session Handle Attributes
        kw("APPL-ALERT-BOXES"),
        kw("BASE-ADE"),
        kw("BATCH-MODE"),
        kw("CHARSET"),
        kw("CLIENT-TYPE"),
        kw("CONTEXT-HELP-FILE"),
        kw("CPCASE"),
        kw("CPCOLL"),
        kw("CPINTERNAL"),
        kw("CPLOG"),
        kw("CPPRINT"),
        kw("CPRCODEIN"),
        kw("CPRCODEOUT"),
        kw("CPSTREAM"),
        kw("CPTERM"),
        kw("CURRENT-REQUEST-INFO"),
        kw("CURRENT-RESPONSE-INFO"),
        kw("DATA-ENTRY-RETURN"),
        kw("DATE-FORMAT"),
        kw("DEBUG-ALERT"),
        kw("DISPLAY-TIMEZONE"),
        kw("DISPLAY-TYPE"),
        kw("ERROR-STACK-TRACE"),
        kw("EXECUTION-LOG"),
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
        kw("FRAME-SPACING"),
        kw("HANDLE"),
        kw("HEIGHT-CHARS"),
        kw("HEIGHT-PIXELS"),
        kw("ICFPARAMETER"),
        kw("IMMEDIATE-DISPLAY"),
        kw("INHERIT-BGCOLOR"),
        kw("INHERIT-FGCOLOR"),
        kw("INSTANTIATING-PROCEDURE"),
        kw("LAST-CHILD"),
        kw("LAST-FORM"),
        kw("LAST-OBJECT"),
        kw("LAST-PROCEDURE"),
        kw("LAST-SERVER"),
        kw("LAST-SERVER-SOCKET"),
        kw("LAST-SOCKET"),
        kw("LOCAL-VERSION-INFO"),
        kw("MULTITASKING-INTERVAL"),
        kw("NEXT-SIBLING"),
        kw("NUMERIC-DECIMAL-POINT"),
        kw("NUMERIC-FORMAT"),
        kw("NUMERIC-SEPARATOR"),
        kw("PARAMETER"),
        kw("PIXELS-PER-COLUMN"),
        kw("PIXELS-PER-ROW"),
        kw("PRINTER-CONTROL-HANDLE"),
        kw("PRINTER-HDC"),
        kw("PRINTER-NAME"),
        kw("PRINTER-PORT"),
        kw("PROXY-PASSWORD"),
        kw("PROXY-USERID"),
        kw("REMOTE"),
        kw("SCHEMA-CHANGE"),
        kw("SERVER-CONNECTION-BOUND"),
        kw("SERVER-CONNECTION-BOUND-REQUEST"),
        kw("SERVER-CONNECTION-CONTEXT"),
        kw("SERVER-CONNECTION-ID"),
        kw("SERVER-OPERATING-MODE"),
        kw("STARTUP-PARAMETERS"),
        kw("STREAM"),
        kw("SUPER-PROCEDURES"),
        kw("SUPPRESS-WARNINGS"),
        kw("SUPPRESS-WARNINGS-LIST"),
        kw("SYSTEM-ALERT-BOXES"),
        kw("THREE-D"),
        kw("TIME-SOURCE"),
        kw("TIMEZONE"),
        kw("TOOLTIPS"),
        kw("TYPE"),
        kw("V6DISPLAY"),
        kw("WC-ADMIN-APP"),
        kw("WIDTH-CHARS"),
        kw("WIDTH-PIXELS"),
        kw("WINDOW-SYSTEM"),
        kw("WORK-AREA-HEIGHT-PIXELS"),
        kw("WORK-AREA-WIDTH-PIXELS"),
        kw("WORK-AREA-X"),
        kw("WORK-AREA-Y"),
        kw("YEAR-OFFSET"),
        kw("TEMP-DIRECTORY"),
      ),

    system_handle_method: $ =>
      choice(
        // Procedure handle methods
        kw("ADD-SUPER-PROCEDURE"),
        kw("GET-SIGNATURE"),
        kw("REMOVE-SUPER-PROCEDURE"),
        kw("SET-CALLBACK"),
        kw("SET-CALLBACK-PROCEDURE"),

        // Session Handle Methods
        kw("ADD-SUPER-PROCEDURE"),
        kw("EXPORT"),
        kw("GET-PRINTERS"),
        kw("GET-WAIT-STATE"),
        kw("REMOVE-SUPER-PROCEDURE"),
        kw("SET-NUMERIC-FORMAT"),
        kw("SET-WAIT-STATE"),
      ),

    //
    // Functions
    //

    _accumulate_function: $ =>
      seq(
        kw("ACCUMULATE"),
        choice(
          kw("AVERAGE"),
          kw("COUNT"),
          kw("MAXIMUM"),
          kw("MINIMUM"),
          kw("TOTAL"),
          kw("SUB-AVERAGE"),
          kw("SUB-COUNT"),
          kw("SUB-MAXIMUM"),
          kw("SUB-MINIMUM"),
          kw("SUB-TOTAL"),
        ),
        optional(kw("BY")),
        // TODO: Resolve conflict when using _expression
        choice($.identifier, $.reference_attribute),
      ),

    _ambiguos_function: $ =>
      seq(kw("AMBIGUOS"), choice($.identifier, seq("(", $.identifier, ")"))),

    _available_function: $ =>
      seq(kw("AVAILABLE"), choice($.identifier, seq("(", $.identifier, ")"))),

    _function: $ =>
      seq(
        choice(
          kw("ABSOLUTE"),
          kw("ADD-INTERVAL"),
          kw("ASC"),
          kw("AUDIT-ENABLED"),
          kw("ALIAS"),
          kw("ENTRY"),
          kw("FILL"),
          kw("INDEX"),
          kw("LENGTH"),
          kw("NUM-ENTRIES"),
          kw("REPLACE"),
          kw("SUBSTRING"),
          kw('VALID-EVENT'),
          kw('VALID-HANDLE'),
          kw('VALID-OBJECT'),
          kw('WEEKDAY'),
          kw('WIDGET-HANDLE'),
          kw('YEAR')
        ),
        $.argument_list,
      ),

    _keyword_function: $ => choice(kw("TODAY")),

    _statement_function: $ =>
      choice(
        $._accumulate_function,
        $._ambiguos_function,
        $._available_function,
      ),

    builtin_function: $ =>
      choice($._function, $._keyword_function, $._statement_function),

    //
    // Statements
    //

    _statement: $ =>
      choice(
        seq(
          choice(
            $.accumulate_statement,
            $.aggregate_statement,
            $.assign_statement,
            $.apply_statement,

            $.case_statement,
            $.compile_statement,

            $.define_buffer_statement,
            $.define_parameter_statement,
            $.define_variable_statement,

            $.do_statement,

            $.error_level_statement,
            alias($._expression, $.expression_statement),

            $.procedure_statement,

            $.quit_statement,

            $.run_statement,

            $.using_statement,

            $.validate_statement,
            $.var_statement,
            $.view_statement,

            $.wait_for_statement,
          ),
          $._end_of_statement,
        ),
        alias($._end_of_statement, $.empty_statement),
      ),

    accumulate_statement: $ =>
      seq(
        kw("ACCUMULATE"),
        $._expression,
        "(",
        repeat1(
          choice(
            kw("AVERAGE"),
            kw("COUNT"),
            kw("MAXIMUM"),
            kw("MINIMUM"),
            kw("TOTAL"),
            kw("SUB-AVERAGE"),
            kw("SUB-COUNT"),
            kw("SUB-MAXIMUM"),
            kw("SUB-MINIMUM"),
            kw("SUB-TOTAL"),
          ),
        ),
        repeat(seq(kw("BY"), $._expression)),
        ")",
      ),

    aggregate_statement: $ =>
      seq(
        kw("AGGREGATE"),
        $.identifier,
        "=",
        choice(kw("COUNT"), kw("TOTAL"), kw("AVERAGE")),
        "(",
        $.identifier,
        ")",
        kw("FOR"),
        $.identifier,
        optional($._where_clause),
      ),

    assign_statement: $ =>
      seq(
        kw("ASSIGN"),
        choice(
          repeat1($._assign_spec),
          seq($.identifier, optional(seq(kw("EXCEPT"), repeat1($.identifier)))),
        ),
        optional(kw("NO-ERROR")),
      ),

    _assign_spec: $ =>
      seq($.assignment_expression, optional(seq(kw("WHEN"), $._expression))),

    apply_statement: $ =>
      seq(
        kw("APPLY"),
        $._primary_expression,
        optional(seq(kw("TO"), $._widget_phrase)),
      ),

    case_statement: $ =>
      seq(
        kw("CASE"),
        $._expression,
        $._statement_colon,
        repeat1($._when_spec),
        kw("END"),
        kw("CASE"),
      ),

    _when_spec: $ =>
      seq(
        sep1(seq(kw("WHEN"), $._expression), kw("OR")),
        kw("THEN"),
        $._statement,
      ),

    compile_statement: $ =>
      seq(
        kw("COMPILE"),
        choice(
          $._value,
          // TODO: path
        ),
        anyOf(
          seq(kw("OPTIONS"), $.character_literal),
          seq(
            kw("SAVE"),
            optional(seq("=", $._expression)),
            optional(seq(kw("INTO"), choice($._value))),
          ),
          seq(
            kw("XREF-XML"),
            choice(
              $._value,
              //TODO: path
            ),
          ),
          kw("NO-ERROR"),
        ),
      ),

    _save_spec: $ => seq(kw("SAVE"), kw("FALSE")),

    _define_statement: $ =>
      seq(
        kw("DEFINE"),
        anyOf(
          $._new_global_shared,
          $._access_mode,
          $._serializable,
          kw("STATIC"),
        ),
      ),

    define_buffer_statement: $ =>
      seq(
        $._define_statement,
        kw("BUFFER"),
        $.identifier,
        kw("FOR"),
        optional(kw("TEMP-TABLE")),
        $.identifier,
        anyOf(
          kw("PRESELECT"),
          $._label,
          $._namespace_uri,
          $._namespace_prefix,
          $._xml_node_name,
          $._serialize_name,
        ),
      ),

    define_parameter_statement: $ =>
      seq(
        kw("DEFINE"),
        choice(kw("INPUT"), kw("OUTPUT"), kw("INPUT-OUTPUT"), kw("RETURN")),
        kw("PARAMETER"),
        $.identifier,
        kw("AS"),
        $._datatype,
        anyOf(
          $._case_sensitive,
          $._format,
          $._decimals,
          $._initial,
          $._column_label,
          $._label,
          kw("NO-UNDO"),
        ),
      ),

    define_variable_statement: $ =>
      seq(
        $._define_statement,
        kw("VARIABLE"),
        $.identifier,
        kw("AS"),
        $._datatype,
        anyOf($._serialize_name, kw("NO-UNDO")),
      ),

    error_level_statement: $ =>
      seq(
        choice(kw("BLOCK-LEVEL"), kw("ROUTINE-LEVEL")),
        kw("ON"),
        kw("ERROR"),
        kw("UNDO"),
        ",",
        kw("THROW"),
      ),

    do_statement: $ =>
      seq(
        optional(seq($.identifier, $._statement_colon)),
        kw("DO"),
        optional(
          choice(
            seq($.identifier, "=", $._expression, kw("TO"), $._expression),
            seq(kw("WHILE"), $._expression),
            kw("TRANSACTION"),
          ),
        ),
        $._code_block,
      ),

    procedure_statement: $ =>
      seq(
        kw("PROCEDURE"),
        $.identifier,
        $._code_block,
        optional(kw("PROCEDURE")),
      ),

    quit_statement: $ => kw("QUIT"),

    run_statement: $ =>
      seq(
        kw("RUN"),
        choice(
          $.identifier,
          seq(kw("VALUE"), "(", $._expression, ")"),
          // TODO: path name
        ),
        anyOf(
          // TODO: see documentaion ...
          //
          $.argument_list,
          kw("NO-ERROR"),
        ),
      ),

    using_statement: $ =>
      seq(
        kw("USING"),
        $.identifier,
        optional(seq(kw("FROM"), choice(kw("ASSEMBLY"), kw("PROPATH")))),
      ),

    validate_statement: $ =>
      seq(kw("VALIDATE"), $.identifier, optional(kw("NO-ERROR"))),

    var_statement: $ =>
      seq(
        kw("VAR"),
        anyOf($._access_mode, $._serializable, kw("STATIC")),
        $._datatype,
        commaSep1(
          seq(
            $.identifier,
            optional(
              seq(
                "=",
                choice($._expression, seq("[", commaSep1($._expression), "]")),
              ),
            ),
          ),
        ),
      ),

    view_statement: $ =>
      seq(
        kw("VIEW"),
        choice(
          seq(kw("STREAM"), $.identifier),
          seq(kw("STREAM-HANDLE"), $.identifier),
          $._widget_phrase,
        ),
        optional(seq(kw("IN"), kw("WINDOW"), $.identifier)),
      ),

    wait_for_statement: $ =>
      seq(
        kw("WAIT-FOR"),
        choice(sep1($._event_spec, kw("OR"))),
        anyOf(seq(kw("FOCUS"), $.identifier), seq(kw("PAUSE"), $._expression)),
      ),

    // TODO: look at supporting space delimiters for event list and widget list
    _event_spec: $ =>
      seq(
        sep1(choice(kw("COMPLETE"), kw("CHOOSE")), ","),
        kw("OF"),
        sep1($.identifier, ","),
      ),

    //
    // PreProcessor directives
    //

    preprocessor_directive: $ => choice($.analyze_suspend),

    analyze_suspend: $ => seq(kw("&ANALYZE-SUSPEND"), /[^\n]*/),

    //
    // Helpers
    //

    // TODO
    // _at_phrase: $ => seq(),

    _where_clause: $ => seq(kw("WHERE"), $._expression),
    _widget_phrase: $ =>
      choice(
        seq(kw("FRAME"), $.identifier),
        seq(
          optional(kw("FIELD")),
          $.identifier,
          optional(seq(kw("IN"), kw("FRAME"), $.identifier)),
        ),
        seq($.identifier, optional(seq(kw("IN"), kw("BROWSE"), $.identifier))),
        seq(choice(kw("MENU"), kw("SUB-MENU")), $.identifier),
        $.system_handle,
      ),

    _code_block: $ => seq($._statement_colon, repeat($._statement), kw("END")),

    _datatype: $ =>
      seq(
        choice(
          $.primitive_type,
          seq(optional(kw("CLASS")), $.identifier),

          seq(kw("LIKE"), $.identifier),
        ),
        optional(seq("[", $.integer_literal, "]")),
        optional(seq(kw("EXTENT"), $.integer_literal)),
      ),

    _new_global_shared: $ =>
      seq(optional(seq(kw("NEW"), optional(kw("GLOBAL")))), kw("SHARED")),

    _access_mode: $ => choice(kw("PRIVATE"), kw("PROTECTED"), kw("PUBLIC")),

    _serializable: $ => choice(kw("SERIALIZABLE"), kw("NON-SERIALIZABLE")),

    _case_sensitive: $ => seq(optional(kw("NOT")), kw("CASE-SENSITIVE")),
    _column_label: $ => seq(kw("COLUMN-LABEL"), $.character_literal),
    _decimals: $ => seq(kw("DECIMALS"), $.integer_literal),
    _format: $ => seq(kw("FORMAT"), $.character_literal),
    _initial: $ =>
      seq(
        kw("INITIAL"),
        choice($._literal, seq("[", commaSep1($._literal), "]")),
      ),
    _label: $ => seq(kw("LABEL"), $.character_literal),
    _namespace_uri: $ => seq(kw("NAMESPACE-URI"), $.character_literal),
    _namespace_prefix: $ => seq(kw("NAMESPACE-PREFIX"), $.character_literal),
    _xml_node_name: $ => seq(kw("XML-NODE-NAME"), $.character_literal),
    _serialize_name: $ => seq(kw("SERIALIZE-NAME"), $.character_literal),

    _value: $ => seq(kw("VALUE"), "(", $._expression, ")"),

    _widget_phrase: $ =>
      seq(
        kw("FRAME"),
        $.identifier,
        choice(
          seq(
            kw("FIELD"),
            $.identifier,
            optional(seq(kw("IN"), kw("FRAME"), $.identifier)),
          ),
          seq(choice(kw("MENU"), kw("SUB-MENU")), $.identifier),
          seq(
            kw("MENU-ITEM"),
            $.identifier,
            optional(seq(kw("IN"), kw("MENU"), $.identifier)),
          ),
          $.system_handle,
          seq(
            $.identifier,
            optional(seq(kw("IN"), kw("BROWSE"), $.identifier)),
          ),
        ),
      ),
  },
});

// Generate case insentitive match for ABL keyword
function kw(keyword) {
  if (knownKeywords.indexOf(keyword) === -1) {
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

function sep2(rule, separator) {
  return seq(rule, repeat1(seq(separator, rule)));
}
