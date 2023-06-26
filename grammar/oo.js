const { commaSep1 } = require('./helper');

module.exports = {
  _type_list: $ => commaSep1($._name),

  class_statement: $ => seq(
    $.kwCLASS,
    field('typename', $._name),
    repeat(
      choice(
        field('superclass', seq($.kwINHERITS, $._name)),
        field('interfaces', seq($.kwIMPLEMENTS, $._type_list)),
        $.kwUSE_WIDGET_POOL,
        field('modifier', choice($.kwFINAL, $.kwABSTRACT)),
        $.kwSERIALIZABLE
      )
    ),
    ':',
    repeat(choice(
      $.define_buffer_statement,
      $.define_event_statement,
      $.define_property_statement,
      $.method_statement
    )),
    $.kwEND,
    optional($.kwCLASS),
    '.'
  ),

  interface_statement: $ => seq(
    $.kwINTERFACE,
    field('typename', $._name),
    optional(field('super_interfaces', seq($.kwINHERITS, $._type_list))),
    ':',
    repeat(choice(
      $.define_event_prototype,
      $.define_property_prototype,
      $.method_prototype
    )),
    $.kwEND,
    optional($.kwINTERFACE),
    '.'
  ),

  // Class, Interface, Enum Members

  define_event_prototype: $ => eventWith($),

  define_event_statement: $ => eventWith($),

  method_prototype: $ => methodWith($,
    optional($.kwPUBLIC)
  ),

  method_statement: $ => methodWith($,
    repeat(
      choice(
        choice($.kwPRIVATE, $.kwPROTECTED, $.kwPUBLIC),
        choice($.kwSTATIC, $.kwABSTRACT),
        $.kwOVERRIDE,
        $.kwFINAL,
        choice($.kwSERIALIZABLE, $.kwNON_SERIALIZABLE)
      )
    ),
    seq(
      $.code_block,
      optional($.kwMETHOD),
      '.'
    )
  ),

  define_property_prototype: $ => propertyWith($,
    optional($.kwNO_UNDO),
    repeat1(
      seq(optional($.kwPUBLIC), choice($.kwGET, $.kwSET), '.'),
    )
  ),

  define_property_statement: $ => propertyWith($,
    repeat(
      choice(
        $._initial,
        $._serialize_name,
        seq($.kwNO_UNDO)
      )
    ),
    repeat(
      seq(
        optional(choice($.kwPRIVATE, $.kwPROTECTED, $.kwPUBLIC)),
        choice($.kwGET, $.kwSET),
        optional(
          seq(
            $._parameter_list,
            $.code_block,
            optional(choice($.kwGET, $.kwSET))
          )
        ),
        '.'
      )
    )
  )

}

function eventWith($) {
  return seq(
    $._define_statement,
    $.kwEVENT,
    $.identifier,
    $.kwVOID,
    '(',
    // TODO: parameter list
    ')',
    '.'
  )
}

function methodWith($, modifiers, body = '.') {
  return seq(
    $.kwMETHOD,
    modifiers,
    choice(
      $.kwVOID,
      $._datatype
    ),
    $.identifier,
    $._parameter_list,
    body
  )
}

function propertyWith($, options, setget) {
  return seq(
    $._define_statement,
    $.kwPROPERTY,
    field('name', $.identifier),
    $._as_datatype,
    options,
    setget
  )
}
