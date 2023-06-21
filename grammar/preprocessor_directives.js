module.exports = {
  preprocessor_directive: $ => choice(
    $.analyze_suspend,
    $.ppANALYZE_RESUME,
    $.scoped_define,
    $.if_preprocessor,
    $.ppENDIF
  ),

  analyze_suspend: $ => seq(
    $.ppANALYZE_SUSPEND,
    /[^\n]*/
  ),

  scoped_define: $ => seq(
    $.ppSCOPED_DEFINE,
    // TODO: fix this for multiline
    /[^\n]*/
  ),

  if_preprocessor: $ => seq(
    $.ppIF,
    /.+?/,
    $.ppTHEN
  ),
}
