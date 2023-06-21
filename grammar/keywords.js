module.exports = {

  // Preprocessor
  ppANALYZE_SUSPEND: _ => kw('&ANALYZE-SUSPEND'),
  ppANALYZE_RESUME: _ => kw('&ANALYZE-RESUME'),
  ppSCOPED_DEFINE: _ => kw('&SCOPED-DEFINE'),
  ppIF: _ => kw('&IF'),
  ppTHEN: _ => kw('&THEN'),
  ppENDIF: _ => kw('&ENDIF'),

  // A
  kwABSTRACT: _ => kw('ABSTRACT'),
  kwALERT_BOX: _ => kw('ALERT-BOX'),
  kwAND: _ => kw('AND'),
  kwANYWHERE: _ => kw('ANYWHERE'),
  kwAPPEND: _ => kw('APPEND'),
  kwAS: _ => kw('AS'),
  kwASCENDING: _ => kw('ASCENDING'),
  kwASSEMBLY: _ => kw('ASSEMBLY'),
  kwASSIGN: _ => kw('ASSIGN'),
  kwAUTO_RETURN: _ => kw('AUTO-RETURN'),

  // B
  kwBEFORE_TABLE: _ => kw('BEFORE-TABLE'),
  kwBEGINS: _ => kw('BEGINS'),
  kwBGCOLOR: _ => kw('BGCOLOR'),
  kwBIND: _ => kw('BIND'),
  kwBLOB: _ => kw('BLOB'),
  kwBLOCK_LEVEL: _ => kw('BLOCK-LEVEL', 'BLOCK-LEV'),
  kwBUFFER: _ => kw('BUFFER'),
  kwBUTTONS: _ => kw('BUTTONS'),
  kwBY_VALUE: _ => kw('BY-VALUE'),

  // C
  kwCHARACTER: _ => kw('CHARACTER'),
  kwCLASS: _ => kw('CLASS'),
  kwCLOB: _ => kw('CLOB'),
  kwCOM_HANDLE: _ => kw('COM-HANDLE'),
  kwCREATE: _ => kw('CREATE'),

  // D
  kwDATASET: _ => kw('DATASET'),
  kwDATASET_HANDLE: _ => kw('DATASET-HANDLE'),
  kwDATE: _ => kw('DATE'),
  kwDATETIME: _ => kw('DATETIME'),
  kwDATETIME_TZ: _ => kw('DATETIME-TZ'),
  kwDECIMAL: _ => kw('DECIMAL'),
  kwDEFINE: _ => kw('DEFINE'),
  kwDESCENDING: _ => kw('DESCENDING'),
  kwDO: _ => kw('DO'),

  // E
  kwELSE: _ => kw('ELSE'),
  kwEMPTY: _ => kw('EMPTY'),
  kwEND: _ => kw('END'),
  kwENTRY: _ => kw('ENTRY'),
  kwEQ: _ => kw('EQ'),
  kwERROR: _ => kw('ERROR'),
  kwEVENT: _ => kw('EVENT'),
  kwEXTENT: _ => kw('EXTENT'),

  // F
  kwFALSE: _ => kw('FALSE'),
  kwFIELD: _ => kw('FIELD'),
  kwFILE: _ => kw('FILE'),
  kwFINAL: _ => kw('FINAL'),
  kwFOR: _ => kw('FOR'),
  kwFORMAT: _ => kw('FORMAT'),
  kwFORWARD: _ => kw('FORWARD'),
  kwFROM: _ => kw('FROM'),
  kwFUNCTION: _ => kw('FUNCTION'),

  // G
  kwGE: _ => kw('GE'),
  kwGET: _ => kw('GET'),
  kwGLOBAL: _ => kw('GLOBAL'),
  kwGT: _ => kw('GT'),

  // H
  kwHANDLE: _ => kw('HANDLE'),

  // I
  kwIF: _ => kw('IF'),
  kwIMPLEMENTS: _ => kw('IMPLEMENTS'),
  kwIN: _ => kw('IN'),
  kwINDEX: _ => kw('INDEX'),
  kwINFORMATION: _ => kw('INFORMATION'),
  kwINHERITS: _ => kw('INHERITS'),
  kwINITIAL: _ => kw('INITIAL'),
  kwINPUT: _ => kw('INPUT'),
  kwINPUT_OUTPUT: _ => kw('INPUT-OUTPUT'),
  kwINT64: _ => kw('INT64'),
  kwINTEGER: _ => kw('INTEGER'),
  kwINTERFACE: _ => kw('INTERFACE'),
  kwIS: _ => kw('IS'),

  // J

  // K

  // L
  kwLABEL: _ => kw('LABEL'),
  kwLE: _ => kw('LE'),
  kwLIKE: _ => kw('LIKE'),
  kwLIKE_SEQUENTIAL: _ => kw('LIKE-SEQUENTIAL'),
  kwLOGICAL: _ => kw('LOGICAL'),
  kwLONGCHAR: _ => kw('LONGCHAR'),
  kwLT: _ => kw('LT'),

  // M
  kwMATCHES: _ => kw('MATCHES'),
  kwMEMPTR: _ => kw('MEMPTR'),
  kwMESSAGE: _ => kw('MESSAGE'),
  kwMETHOD: _ => kw('METHOD'),

  // N
  kwNAMESPACE_PREFIX: _ => kw('NAMESPACE-PREFIX'),
  kwNAMESPACE_URI: _ => kw('NAMESPACE-URI'),
  kwNE: _ => kw('NE'),
  kwNEW: _ => kw('NEW'),
  kwNON_SERIALIZABLE: _ => ('NON-SERIALIZABLE'),
  kwNOT: _ => kw('NOT'),
  kwNO_APPLY: _ => kw('NO-APPLY'),
  kwNO_ERROR: _ => kw('NO-ERROR'),
  kwNO_UNDO: _ => kw('NO-UNDO'),
  kwNULL: _ => kw('NULL'),

  // O
  kwOF: _ => kw('OF'),
  kwOK: _ => kw('OK'),
  kwOK_CANCEL: _ => kw('OK-CANCEL'),
  kwOLD: _ => kw('OLD'),
  kwON: _ => kw('ON'),
  kwOR: _ => kw('OR'),
  kwOUTPUT: _ => kw('OUTPUT'),
  kwOVERRIDE: _ => kw('OVERRIDE'),

  // P
  kwPARAMETER: _ => kw('PARAMETER'),
  kwPERSISTENT: _ => kw('PERSISTENT'),
  kwPRESELECT: _ => kw('PRESELECT'),
  kwPRIMARY: _ => kw('PRIMARY'),
  kwPRIVATE: _ => kw('PRIVATE'),
  kwPROCEDURE: _ => kw('PROCEDURE'),
  kwPROPATH: _ => kw('PROPATH'),
  kwPROPERTY: _ => kw('PROPERTY'),
  kwPROTECTED: _ => kw('PROTECTED'),
  kwPUBLIC: _ => kw('PUBLIC'),

  // Q
  kwQUESTION: _ => kw('QUESTION'),

  // R
  kwRAW: _ => kw('RAW'),
  kwRCODE_INFORMATION: _ => kw('RCODE-INFORMATION'),
  kwRECID: _ => kw('RECID'),
  kwREFERENCE_ONLY: _ => kw('REFERENCE-ONLY'),
  kwREPLACE: _ => kw('REPLACE'),
  kwRETRY_CANCEL: _ => kw('RETRY-CANCEL'),
  kwRETURN: _ => kw('RETURN'),
  kwRETURNS: _ => kw('RETURNS'),
  kwREVERT: _ => kw('REVERT'),
  kwROUTINE_LEVEL: _ => kw('ROUTINE-LEVEL'),
  kwROWID: _ => kw('ROWID'),
  kwRUN: _ => kw('RUN'),

  // S
  kwSELF: _ => kw('SELF'),
  kwSERIALIZABLE: _ => kw('SERIALIZABLE'),
  kwSERIALIZE_NAME: _ => kw('SERIALIZE-NAME'),
  kwSET: _ => kw('SET'),
  kwSHARED: _ => kw('SHARED'),
  kwSKIP: _ => kw('SKIP'),
  kwSTATIC: _ => kw('STATIC'),
  kwSTREAM: _ => kw('STREAM'),

  // T
  kwTABLE: _ => kw('TABLE'),
  kwTABLE_HANDLE: _ => kw('TABLE-HANDLE'),
  kwTARGET_PROCEDURE: _ => kw('TARGET-PROCEDURE'),
  kwTEMP_TABLE: _ => kw('TEMP-TABLE'),
  kwTHEN: _ => kw('THEN'),
  kwTHIS_OBJECT: _ => kw('THIS-OBJECT'),
  kwTHIS_PROCEDURE: _ => kw('THIS-PROCEDURE'),
  kwTHROW: _ => kw('THROW'),
  kwTITLE: _ => kw('TITLE'),
  kwTRUE: _ => kw('TRUE'),

  // U
  kwUNDO: _ => kw('UNDO'),
  kwUNIQUE: _ => kw('UNIQUE'),
  kwUPDATE: _ => kw('UPDATE'),
  kwUSE_INDEX: _ => kw('USE-INDEX'),
  kwUSE_WIDGET_POOL: _ => kw('USE-WIDGET-POOL'),
  kwUSING: _ => kw('USING'),

  // V
  kwVALIDATE: _ => kw('VALIDATE'),
  kwVALUE: _ => kw('VALUE'),
  kwVARIABLE: _ => kw('VARIABLE'),
  kwVIEW_AS: _ => kw('VIEW-AS'),
  kwVOID: _ => kw('VOID'),

  // W
  kwWARNING: _ => kw('WARNING'),
  kwWHEN: _ => kw('WHEN'),
  kwWIDGET_HANDLE: _ => kw('WIDGET-HANDLE'),
  kwWINDOW: _ => kw('WINDOW'),
  kwWORD_INDEX: _ => kw('WORD-INDEX'),

  // X
  kwXML_NODE_NAME: _ => kw('XML-NODE-NAME'),

  // Y

  // Z
  kwYES_NO: _ => kw('YES-NO'),
  kwYES_NO_CANCEL: _ => kw('YES-NO-CANCEL')
}

function kw(keyword, abbreviation = '') {
  // Should we care about mIxEdCaSe just caused me issues and slowed it down
  // TODO: Abbreviations :()
  return choice(keyword.toUpperCase(), keyword.toLowerCase());
}
