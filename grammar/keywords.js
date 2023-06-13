module.exports = {
    ppANALYZE_SUSPEND: $ => kw('&ANALYZE-SUSPEND'),
    ppANALYZE_RESUME: $ => kw('&ANALYZE-RESUME'),
    ppSCOPED_DEFINE: $ => kw('&SCOPED-DEFINE'),
    ppIF: $ => kw('&IF'),
    ppTHEN: $ => kw('&THEN'),
    ppENDIF: $ => kw('&ENDIF'),

    // A
    kwABSTRACT: $ => kw('ABSTRACT'),
    kwALERT_BOX: $ => kw('ALERT-BOX'),
    kwAPPEND: $ => kw('APPEND'),
    kwAS: $ => kw('AS'),
    kwASCENDING: $ => kw('ASCENDING'),
    kwASSEMBLY: $ => kw('ASSEMBLY'),
    kwASSIGN: $ => kw('ASSIGN'),
    kwAUTO_RETURN: $ => kw('AUTO-RETURN'),
    // B
    kwBEFORE_TABLE: $ => kw('BEFORE-TABLE'),
    kwBGCOLOR: $ => kw('BGCOLOR'),
    kwBIND: $ => kw('BIND'),
    kwBLOB: $ => kw('BLOB'),
    kwBLOCK_LEVEL: $ => kw('BLOCK-LEVEL', 'BLOCK-LEV'),
    kwBUFFER: $ => kw('BUFFER'),
    kwBUTTONS: $ => kw('BUTTONS'),
    kwBY_VALUE: $ => kw('BY-VALUE'),
    // C
    kwCHARACTER: $ => kw('CHARACTER'),
    kwCREATE: $ => kw('CREATE'),
    kwCLASS: $ => kw('CLASS'),
    kwCLOB: $ => kw('CLOB'),
    kwCOM_HANDLE: $ => kw('COM-HANDLE'),
    // D
    kwDATASET: $ => kw('DATASET'),
    kwDATASET_HANDLE: $ => kw('DATASET-HANDLE'),
    kwDATE: $ => kw('DATE'),
    kwDATETIME: $ => kw('DATETIME'),
    kwDATETIME_TZ: $ => kw('DATETIME-TZ'),
    kwDECIMAL: $ => kw('DECIMAL'),
    kwDEFINE: $ => kw('DEFINE'),
    kwDESCENDING: $ => kw('DESCENDING'),
    kwDO: $ => kw('DO'),
    // E
    kwELSE: $ => kw('ELSE'),
    kwERROR: $ => kw('ERROR'),
    kwEMPTY: $ => kw('EMPTY'),
    kwEND: $ => kw('END'),
    kwENTRY: $ => kw('ENTRY'),
    kwEQ: $ => kw('EQ'),
    kwEVENT: $ => kw('EVENT'),
    kwEXTENT: $ => kw('EXTENT'),
    // F
    kwFALSE: $ => kw('FALSE'),
    kwFIELD: $ => kw('FIELD'),
    kwFILE: $ => kw('FILE'),
    kwFINAL: $ => kw('FINAL'),
    kwFOR: $ => kw('FOR'),
    kwFORMAT: $ => kw('FORMAT'),
    kwFORWARD: $ => kw('FORWARD'),
    kwFROM: $ => kw('FROM'),
    kwFUNCTION: $ => kw('FUNCTION'),
    
    // G
    kwGE: $ => kw('GE'),
    kwGET: $ => kw('GET'),
    kwGLOBAL: $ => kw('GLOBAL'),
    kwGT: $ => kw('GT'),
    // H
    kwHANDLE: $ => kw('HANDLE'),
    // I
    kwIF: $ => kw('IF'),
    kwIMPLEMENTS: $ => kw('IMPLEMENTS'),
    kwIN: $ => kw('IN'),
    kwINDEX: $ => kw('INDEX'),
    kwINFORMATION: $ => kw('INFORMATION'),
    kwINHERITS: $ => kw('INHERITS'),
    kwINITIAL: $ => kw('INITIAL'),
    kwINPUT: $ => kw('INPUT'),
    kwINPUT_OUTPUT: $ => kw('INPUT-OUTPUT'),
    kwINT64: $ => kw('INT64'),
    kwINTEGER: $ => kw('INTEGER'),
    kwINTERFACE: $ => kw('INTERFACE'),
    kwIS: $ => kw('IS'),
    // J
    // K
    // L
    kwLABEL: $ => kw('LABEL'),
    kwLE: $ => kw('LE'),
    kwLIKE: $ => kw('LIKE'),
    kwLIKE_SEQUENTIAL: $ => kw ('LIKE-SEQUENTIAL'),
    kwLOGICAL: $ => kw('LOGICAL'),
    kwLONGCHAR: $ => kw('LONGCHAR'),
    kwLT: $ => kw('LT'),
    // M
    kwMESSAGE: $ => kw('MESSAGE'),
    kwMEMPTR: $ => kw('MEMPTR'),
    kwMETHOD: $ => kw('METHOD'),
    // N
    kwNAMESPACE_URI: $ => kw('NAMESPACE-URI'),
    kwNAMESPACE_PREFIX: $ => kw('NAMESPACE-PREFIX'),
    kwNE: $ => kw('NE'),
    kwNEW: $ => kw('NEW'),
    kwNOT: $ => kw('NOT'),
    kwNO_APPLY: $ => kw('NO-APPLY'),
    kwNO_ERROR: $ => kw('NO-ERROR'),
    kwNON_SERIALIZABLE: $ => ('NON-SERIALIZABLE'),
    kwNO_UNDO: $ => kw('NO-UNDO'),
    kwNULL: $ => kw('NULL'),
    // O
    kwOK: $ => kw('OK'),
    kwOK_CANCEL: $ => kw('OK-CANCEL'),
    kwON: $ => kw('ON'),
    kwOUTPUT: $ => kw('OUTPUT'),
    kwOVERRIDE: $ => kw('OVERRIDE'),
    // P
    kwPARAMETER: $ => kw('PARAMETER'),
    kwPRESELECT: $ => kw('PRESELECT'),
    kwPRIMARY: $ => kw('PRIMARY'),
    kwPRIVATE: $ => kw('PRIVATE'),
    kwPROCEDURE: $ => kw('PROCEDURE'),
    kwPROPATH: $ => kw('PROPATH'),
    kwPROPERTY: $ => kw('PROPERTY'),
    kwPROTECTED: $ => kw('PROTECTED'),
    kwPUBLIC: $ => kw('PUBLIC'),
    // Q
    kwQUESTION: $ => kw('QUESTION'),
    // R
    kwRAW: $ => kw('RAW'),
    kwRECID: $ => kw('RECID'),
    kwRCODE_INFORMATION: $ => kw('RCODE-INFORMATION'),
    kwREFERENCE_ONLY: $ => kw('REFERENCE-ONLY'),
    kwRETRY_CANCEL: $ => kw('RETRY-CANCEL'),
    kwRETURN: $ => kw('RETURN'),
    kwRETURNS: $ => kw('RETURNS'),
    kwREPLACE: $ => kw('REPLACE'),
    kwROUTINE_LEVEL: $ => kw('ROUTINE-LEVEL'),
    kwROWID: $ => kw('ROWID'),
    // S
    kwSERIALIZABLE: $ => kw('SERIALIZABLE'),
    kwSERIALIZE_NAME: $ => kw('SERIALIZE-NAME'),
    kwSET: $ => kw('SET'),
    kwSHARED: $ => kw('SHARED'),
    kwSKIP: $ => kw('SKIP'),
    kwSTATIC: $ => kw('STATIC'),
    kwSTREAM: $ => kw('STREAM'),
    // T
    kwTABLE: $ => kw('TABLE'),
    kwTABLE_HANDLE: $ => kw('TABLE-HANDLE'),
    kwTEMP_TABLE: $ => kw('TEMP-TABLE'),
    kwTHEN: $ => kw('THEN'),
    kwTITLE: $ => kw('TITLE'),
    kwTHIS_PROCEDURE: $ => kw('THIS-PROCEDURE'),
    kwTHROW: $ => kw('THROW'),
    kwTRUE: $ => kw('TRUE'),
    // U
    kwUNDO: $ => kw('UNDO'),
    kwUNIQUE: $ => kw('UNIQUE'),
    kwUPDATE: $ => kw('UPDATE'),
    kwUSE_INDEX: $ => kw('USE-INDEX'),
    kwUSE_WIDGET_POOL: $ => kw('USE-WIDGET-POOL'),
    kwUSING: $ => kw('USING'),
    // V
    kwVALIDATE: $ => kw('VALIDATE'),
    kwVARIABLE: $ => kw('VARIABLE'),
    kwVIEW_AS: $ => kw('VIEW-AS'),
    kwVOID: $ => kw('VOID'),
    // W
    kwWARNING: $ => kw('WARNING'),
    kwWHEN: $ => kw('WHEN'),
    kwWIDGET_HANDLE: $ => kw('WIDGET-HANDLE'),
    kwWINDOW: $ => kw('WINDOW'),
    kwWORD_INDEX: $ => kw('WORD-INDEX'),
    // X
    kwXML_NODE_NAME: $ => kw('XML-NODE-NAME'),
    // Y
    // Z 
    kwYES_NO: $=> kw('YES-NO'),
    kwYES_NO_CANCEL: $ => kw('YES-NO-CANCEL')
}

function kw(keyword, abbreviation = '') {
  // Should we care about mIxEdCaSe just caused me issues and slowed it down
  // TODO: Abbreviations :()
	return choice(keyword.toUpperCase(), keyword.toLowerCase());
}