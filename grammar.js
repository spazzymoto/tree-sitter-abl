const { sep1, commaSep, commaSep1 } = require('./grammar/helper');

const DIGITS = token(sep1(/[0-9]+/, /_+/));

const PREC = {
  DEFAULT: 0,
  ASSIGNMENT: 1,    // =  += -=  *=  /=
  LOGICAL_OR: 2,    // ||
  LOGICAL_AND: 3,   // &&
  BIT_OR: 4,        // |
  BIT_XOR: 5,       // ^
  BIT_AND: 6,       // &
  EQUALITY: 7,      // ==  !=
  RELATIONAL: 8,    // <  <=  >  >=  instanceof
  SHIFT: 9,         // <<  >>  >>>
  ADD: 10,          // +  -
  MULTIPLY: 11,     // *  /  %
  CAST: 12,         // (Type)
  UNARY: 13,        // ++a  --a  a++  a--  +  -  !  ~
  CALL: 14,         // ()
  NEW: 15,          // NEW
  FIELD: 16,        // .
  MEMBER: 17,       // :
  SUBSCRIPT: 18,    // [index]
};

const _keywords = require('./grammar/keywords');
const _oo = require('./grammar/oo');
const _pp = require('./grammar/preprocessor_directives');

module.exports = grammar({
  name: 'abl',

  externals: $ => [
    $.block_comment,
    $.preprocessor,
  ],

  extras: $ => [
    $.line_comment,
    $.block_comment,
    $.preprocessor,
    /\s|\\\r?\n/,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.program, $.expression]
  ],

  supertypes: $ => [
    $.expression,
    $.statement
  ],

  rules: {
    program: $ => repeat(
      choice(
        $.preprocessor_directive,
        $.preprocessor,
        $.statement,
      )
    ),

    line_comment: _ => seq('//', /[^\n]*/),

    //
    // Literals
    //

    _literal: $ => choice(
      $.decimal_integer_literal,
      $.true,
      $.false,
      $.character_literal,
      $.unknown_literal
    ),

    decimal_integer_literal: _ => DIGITS,

    true: $ => $.kwTRUE,

    false: $ => $.kwFALSE,

    character_literal: $ => seq(
      field('literal', choice(
        seq("'", repeat(choice(/[^~'\n]/, /~(.|\n)/)), "'"),
        seq('"', repeat(choice(/[^~"\n]/, /~(.|\n)/)), '"'),
      )),
      optional(field('modifier', $.character_modifier))
    ),

    character_modifier: _ => ':U',

    unknown_literal: _ => '?',

    identifier: _ => /[a-zA-Z_]\w*/,

    _name: $ => choice(
      $.identifier,
      $.scoped_identifier
    ),

    scoped_identifier: $ => prec(PREC.FIELD, seq(
      field('scope', $._name),
      '.',
      field('name', $.identifier)
    )),

    //
    // Types
    //

    _type: $ => choice(
      $.primitive_type
    ),

    primitive_type: $ => choice(
      $.kwBLOB,
      $.kwCHARACTER,
      $.kwCLOB,
      $.kwCOM_HANDLE,
      $.kwDATE,
      $.kwDATETIME,
      $.kwDATETIME_TZ,
      $.kwDECIMAL,
      $.kwHANDLE,
      $.kwINT64,
      $.kwINTEGER,
      $.kwLOGICAL,
      $.kwLONGCHAR,
      $.kwMEMPTR,
      $.kwRAW,
      $.kwRECID,
      $.kwROWID,
      $.kwWIDGET_HANDLE
    ),

    //
    // Expressions
    //

    expression: $ => choice(
      $._literal,
      $._system_handle,
      $.identifier,

      $.binary_expression,
      $.unary_expression,
      // $.assignment_expression,
      $.call_expression,
      $.if_then_else_expression,
      $.new_expression,
      $.member_expression,
      $.parenthesized_expression,
      $.subscript_expression,

      $.builtin_function,
      $.pseudo_function,

      $.preprocessor
    ),

    parenthesized_expression: $ => seq(
      '(',
      $.expression,
      ')'
    ),

    unary_expression: $ => choice(
      ...[
        ['+', PREC.UNARY],
        ['-', PREC.UNARY],
        [$.kwNOT, PREC.UNARY],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('operator', operator),
          field('operand', $.expression)
        ))
      )
    ),

    binary_expression: $ => choice(
      ...[

        [$.kwBEGINS, PREC.RELATIONAL],
        [$.kwMATCHES, PREC.RELATIONAL],
        [$.kwGT, PREC.RELATIONAL],
        [$.kwLT, PREC.RELATIONAL],
        [$.kwGE, PREC.RELATIONAL],
        [$.kwLE, PREC.RELATIONAL],
        ['>', PREC.RELATIONAL],
        ['<', PREC.RELATIONAL],
        ['>=', PREC.RELATIONAL],
        ['<=', PREC.RELATIONAL],

        [$.kwEQ, PREC.EQUALITY],
        [$.kwNE, PREC.EQUALITY],
        ['=', PREC.EQUALITY],
        ['<>', PREC.EQUALITY],

        [$.kwAND, PREC.LOGICAL_AND],
        [$.kwOR, PREC.LOGICAL_OR],
        ['+', PREC.ADD],
        ['-', PREC.ADD],
        ['*', PREC.MULTIPLY],
        ['/', PREC.MULTIPLY],

      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $.expression),
          field('operator', operator),
          field('right', $.expression)
        ))
      )
    ),

    assignment_expression: $ => prec.right(PREC.ASSIGNMENT, seq(
      field('left', choice(
        $.identifier,
        $.pseudo_function,
        $.member_expression
      )),
      field('operator', choice('=', '+=', '-=', '*=', '/=')),
      field('right', $.expression),

      // TODO this must be conditional when in an assign statement
      optional(seq($.kwWHEN, field('when', $.expression)))
    )),

    call_expression: $ => prec(PREC.CALL, seq(
      field('function', $.expression),
      field('arguments', $.argument_list),
    )),

    if_then_else_expression: $ => prec.right(seq(
      $.kwIF,
      $.expression,
      $.kwTHEN,
      $.expression,
      $.kwELSE,
      $.expression,
    )),

    member_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $.expression),
      ':',
      field('property', $.identifier)
    )),

    new_expression: $ => prec.right(PREC.NEW, seq(
      $.kwNEW,
      field('constructor', $._name),
      field('arguments', $.argument_list)
    )),

    subscript_expression: $ => prec.right(PREC.SUBSCRIPT, seq(
      field('object', $.expression),
      '[',
      field('index', $.expression),
      ']'
    )),

    argument_list: $ => seq(
      '(',
      commaSep(seq(
        optional(choice($.kwINPUT, $.kwOUTPUT, $.kwINPUT_OUTPUT)),
        $.expression
      )),
      ')'
    ),

    //
    // System Handles
    //

    _system_handle: $ => choice(
      $.kwSELF,
      $.kwTARGET_PROCEDURE,
      $.kwTHIS_OBJECT,
      $.kwTHIS_PROCEDURE,
    ),

    //
    // Functions
    //

    builtin_function: $ => seq(
      choice(
        $.kwNUM_ENTRIES,
        $.kwREPLACE,
        $.kwVALID_OBJECT
      ),
      $.argument_list
    ),

    pseudo_function: $ => choice(
      $.entry_function
    ),

    entry_function: $ => seq($.kwENTRY, $.argument_list),

    //
    // Statements
    //

    statement: $ => choice(
      $.empty_statement,
      $.expression_statement,

      // OpenEdge Language Statements

      $.annotation_statement,
      $.assign_statement,

      $.block_level_statement,

      $.class_statement,
      $.create_statement,

      $.define_buffer_statement,
      $.define_dataset_statement,
      $.define_procedure_parameter_statement,
      $.define_stream_statement,
      $.do_statement,

      $.empty_temp_table_statement,

      $.function_forward_statement,

      $.if_then_else_statement,
      $.interface_statement,

      $.message_statement,

      $.procedure_statement,

      $.return_statement,
      $.routine_level_statement,

      $.temp_table_statement,

      $.using_statement,

      $.variable_statement
    ),

    expression_statement: $ => choice(
      seq($.expression, '.'),
      seq($.assignment_expression, '.')
    ),

    empty_statement: _ => '.',

    //
    // Statement Components
    //

    code_block: $ => seq(':', repeat($.statement), $.kwEND),
    _do_block: $ => seq(
      $.kwDO,
      optional(
        choice(
          seq($.identifier, '=', $.expression, $.kwTO, $.expression),
          seq($.kwWHILE, $.expression),
          $.kwTRANSACTION
        ) 
      ),
      $.code_block
    ),

    parameter_declaration: $ => choice(
      seq(
        optional(choice($.kwINPUT, $.kwOUTPUT, $.kwINPUT_OUTPUT)),
        choice(
          seq($.identifier, $._as_datatype),
          seq($.kwLIKE, $.scoped_identifier),
          seq(
            choice(
              $.kwTABLE,
              $.kwTABLE_HANDLE,
              $.kwDATASET,
              $.kwDATASET_HANDLE
            ),
            $.identifier,
            repeat(
              choice(
                $.kwAPPEND,
                $.kwBIND,
                $.kwBY_VALUE,
              )
            )
          )
        )
      ),
      seq(
        $.kwBUFFER,
        $.identifier,
        $.kwFOR,
        $.identifier,
        optional($.kwPRESELECT)
      )
    ),

    _parameter_list: $ => seq(
      '(',
      commaSep($.parameter_declaration),
      ')'
    ),

    _define_statement: $ => seq(
      $.kwDEFINE,
      repeat(
        choice(
          seq(optional(seq($.kwNEW, optional($.kwGLOBAL))), $.kwSHARED),
          choice($.kwPUBLIC, $.kwPROTECTED, $.kwPRIVATE),
          choice($.kwSTATIC, $.kwABSTRACT),
          $.kwOVERRIDE,
          choice($.kwSERIALIZABLE, $.kwNON_SERIALIZABLE)
        )
      )
    ),

    _datatype: $ => field('type', seq(choice($.primitive_type, seq(optional($.kwCLASS), $._name)), optional(seq($.kwEXTENT, $.decimal_integer_literal)))),
    _as_datatype: $ => prec.right(PREC.ASSIGNMENT, seq($.kwAS, $._datatype)),
    _format: $ => seq($.kwFORMAT, field('format', $.character_literal)),
    _initial: $ => seq($.kwINITIAL, field('initial', $._literal)),
    _label: $ => seq($.kwLABEL, field('label', $.character_literal)),
    _namespace_uri: $ => seq($.kwNAMESPACE_URI, field('namespace_uri', $.character_literal)),
    _namespace_prefix: $ => seq($.kwNAMESPACE_PREFIX, field('namespace_prefix', $.character_literal)),
    _xml_node_name: $ => seq($.kwXML_NODE_NAME, field('xml_node_name', $.character_literal)),
    _serialize_name: $ => seq($.kwSERIALIZE_NAME, field('serialize_name', $.character_literal)),
    _validate_use_index: $ => choice($.kwVALIDATE, seq($.kwUSE_INDEX, $.identifier, optional(seq($.kwAS, $.kwPRIMARY)))),

    //
    // OpenEdge Language Statements
    //

    annotation_attribute: $ => seq($.identifier, '=', $.character_literal),
    annotation_attribute_list: $ => seq('(', commaSep1($.annotation_attribute), ')'),

    annotation_statement: $ => prec(PREC.CALL + 1, seq(
      '@',
      field('name', $._name),
      field('scope', optional($.kwFILE)),
      field('attributes', optional($.annotation_attribute_list)),
      '.'
    )),

    assign_statement: $ => seq(
      $.kwASSIGN,
      repeat($.assignment_expression),
      optional($.kwNO_ERROR),
      '.'
    ),

    block_level_statement: $ => seq($.kwBLOCK_LEVEL, $.kwON, $.kwERROR, $.kwUNDO, ',', $.kwTHROW, '.'),

    create_statement: $ => seq(
      $.kwCREATE,
      $._name,
      optional($.kwNO_ERROR),
      '.'
    ),

    define_buffer_statement: $ => seq(
      $._define_statement,
      $.kwBUFFER,
      $.identifier,
      $.kwFOR,
      optional($.kwTEMP_TABLE),
      $.identifier,
      repeat(
        choice(
          $.kwPRESELECT,
          $._label,
          $._namespace_uri,
          $._namespace_prefix,
          $._xml_node_name,
          $._serialize_name
        )
      ),
      '.'
    ),

    define_dataset_statement: $ => seq(
      $._define_statement,
      $.kwDATASET,
      $.identifier,
      repeat(
        choice(
          // TODO: missing options
          $._namespace_uri,
          $._namespace_prefix,
          $._xml_node_name,
          $._serialize_name,
          $.kwREFERENCE_ONLY,
        )
      ),
      $.kwFOR,
      commaSep1($.identifier),
      '.'
    ),

    define_procedure_parameter_statement: $ => seq(
      $._define_statement,
      choice($.kwINPUT, $.kwOUTPUT),
      $.kwPARAMETER,
      $.identifier,
      $._as_datatype,
      optional($.kwNO_UNDO),
      '.'
    ),

    define_stream_statement: $ => seq(
      $._define_statement,
      $.kwSTREAM,
      $.identifier
    ),

    do_statement: $ => seq(
      optional(field('label', $.identifier, ':')),
      $._do_block,
      '.'
    ),

    empty_temp_table_statement: $ => seq(
      $.kwEMPTY,
      $.kwTEMP_TABLE,
      $.identifier,
      optional($.kwNO_ERROR),
      '.'
    ),

    function_forward_statement: $ => seq(
      $.kwFUNCTION,
      $.identifier,
      $.kwRETURNS,
      $._datatype,
      $._parameter_list,
      $.kwFORWARD,
      '.'
    ),

    if_then_else_statement: $ => prec.right(seq(
      $.kwIF,
      $.expression,
      $.kwTHEN,
      $.statement,
      optional(
        seq(
          $.kwELSE,
          $.statement,
        )
      )
    )),

    message_statement: $ => seq(
      $.kwMESSAGE,
      repeat(choice($.expression, $.kwSKIP)),
      repeat(
        choice(
          seq(
            $.kwVIEW_AS,
            $.kwALERT_BOX,
            optional(choice($.kwMESSAGE, $.kwQUESTION, $.kwINFORMATION, $.kwERROR, $.kwWARNING)),
            optional(seq($.kwBUTTONS, choice($.kwYES_NO, $.kwYES_NO_CANCEL, $.kwOK, $.kwOK_CANCEL, $.kwRETRY_CANCEL))),
            optional(seq($.kwTITLE, $.character_literal))
          ),
          seq(
            choice($.kwSET, $.kwUPDATE),
            $.identifier,
            choice($._as_datatype, seq($.kwLIKE, $.identifier)),
            optional(seq($.kwFORMAT, $.character_literal)),
            optional($.kwAUTO_RETURN)
          ),
          seq(
            $.kwIN,
            $.kwWINDOW,
            $.identifier
          )
        )
      ),
      '.'
    ),

    procedure_statement: $ => seq(
      $.kwPROCEDURE,
      $.identifier,
      $.code_block,
      optional($.kwPROCEDURE),
      '.'
    ),

    return_statement: $ => seq(
      $.kwRETURN,
      optional(
        choice(
          seq($.kwERROR, optional($.expression)),
          $.kwNO_APPLY,
          $.expression
        )
      ),
      '.'
    ),

    routine_level_statement: $ => seq($.kwROUTINE_LEVEL, $.kwON, $.kwERROR, $.kwUNDO, ',', $.kwTHROW, '.'),

    temp_table_field: $ => seq(
      $.kwFIELD,
      $.identifier,
      choice(
        $._as_datatype,
        seq($.kwLIKE, $.identifier, optional($.kwVALIDATE))
      ),
      repeat(
        choice(
          // TODO: missing properties
          $._serialize_name
        )
      )
    ),

    temp_table_index: $ => seq(
      $.kwINDEX,
      $.identifier,
      repeat(
        choice(
          choice($.kwAS, $.kwIS),
          $.kwUNIQUE,
          $.kwPRIMARY,
          $.kwWORD_INDEX,
          $.kwDESCENDING,
        )
      ),
      repeat(seq(
        $.identifier,
        optional(choice($.kwASCENDING, $.kwDESCENDING))
      ))
    ),

    temp_table_statement: $ => seq(
      $._define_statement,
      $.kwTEMP_TABLE,
      $.identifier,
      repeat(
        choice(
          $.kwNO_UNDO,
          $._namespace_uri,
          $._namespace_prefix,
          $._xml_node_name,
          $._serialize_name,
          $.kwREFERENCE_ONLY,
          seq(choice($.kwLIKE, $.kwLIKE_SEQUENTIAL), $.identifier, repeat($._validate_use_index)),
          $.kwRCODE_INFORMATION,
          seq($.kwBEFORE_TABLE, $.identifier)
        )
      ),
      field('fields', repeat($.temp_table_field)),
      field('indecies', repeat($.temp_table_index)),
      '.'
    ),

    using_statement: $ => seq(
      $.kwUSING,
      repeat(seq($.preprocessor, '.')),
      $._name,
      optional(seq('.', '*')),
      optional(seq($.kwFROM, choice($.kwASSEMBLY, $.kwPROPATH))),
      '.'
    ),

    variable_statement: $ => seq(
      $._define_statement,
      $.kwVARIABLE,
      $.identifier,
      $._as_datatype,
      repeat(
        choice(
          $._serialize_name,
          $._label,
          $._initial,
          $._format,
          $.kwNO_UNDO
        )
      ),
      '.'
    ),

    //
    // Extras
    //

    ..._pp,
    ..._oo,
    ..._keywords
  }
});

