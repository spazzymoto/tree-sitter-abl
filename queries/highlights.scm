;;;

[
  (line_comment)
  (block_comment)
  (preprocessor)
  (analyze_suspend)
  (ppANALYZE_RESUME)
  (scoped_define)
  (if_preprocessor)
  (ppENDIF)
] @comment

(identifier) @variable

; Literals

(character_literal) @string

[
  (decimal_integer_literal)
] @number

; keyword
[
  (kwABSTRACT)
  (kwALERT_BOX)
  (kwAS)
  (kwASCENDING)
  (kwASSEMBLY)
  (kwASSIGN)
  (kwAUTO_RETURN)
  (kwBEFORE_TABLE)
  (kwBLOCK_LEVEL)
  (kwBUFFER)
  (kwBUTTONS)
  (kwCHARACTER)
  (kwCREATE)
  (kwCLASS)
  (kwDATASET)
  (kwDEFINE)
  (kwDESCENDING)
  (kwDO)
  (kwELSE)
  (kwERROR)
  (kwEMPTY)
  (kwEND)
  (kwENTRY)
  (kwEQ)
  (kwEVENT)
  (kwEXTENT)
  (kwFALSE)
  (kwFIELD)
  (kwFILE)
  (kwFINAL)
  (kwFOR)
  (kwFORMAT)
  (kwFROM)
  (kwFUNCTION)
  (kwFORWARD)
  (kwGE)
  (kwGET)
  (kwGLOBAL)
  (kwGT)
  (kwIF)
  (kwIMPLEMENTS)
  (kwIN)
  (kwINDEX)
  (kwINFORMATION)
  (kwINHERITS)
  (kwINITIAL)
  (kwINTERFACE)
  (kwINTEGER)
  (kwINPUT)
  (kwIS)
  (kwLABEL)
  (kwLE)
  (kwLIKE)
  (kwLIKE_SEQUENTIAL)
  (kwLOGICAL)
  (kwLONGCHAR)
  (kwLT)
  (kwMESSAGE)
  (kwMETHOD)
  (kwNAMESPACE_URI)
  (kwNAMESPACE_PREFIX)
  (kwNE)
  (kwNEW)
  (kwNOT)
  (kwNO_APPLY)
  (kwNO_ERROR)
  (kwNON_SERIALIZABLE)
  (kwNO_UNDO)
  (kwOK)
  (kwOK_CANCEL)
  (kwON)
  (kwOVERRIDE)
  (kwPRESELECT)
  (kwPARAMETER)
  (kwPRIMARY)
  (kwPRIVATE)
  (kwPROPATH)
  (kwPROPERTY)
  (kwPROTECTED)
  (kwPROCEDURE)
  (kwPUBLIC)
  (kwQUESTION)
  (kwRCODE_INFORMATION)
  (kwREFERENCE_ONLY)
  (kwRETRY_CANCEL)
  (kwREPLACE)
  (kwRETURN)
  (kwRETURNS)
  (kwROUTINE_LEVEL)
  (kwSHARED)
  (kwSKIP)
  (kwSTATIC)
  (kwSERIALIZABLE)
  (kwSERIALIZE_NAME)
  (kwSET)
  (kwSTREAM)
  (kwTEMP_TABLE)
  (kwTHEN)
  (kwTITLE)
  (kwTHIS_PROCEDURE)
  (kwTHROW)
  (kwTRUE)
  (kwUNDO)
  (kwUNIQUE)
  (kwUPDATE)
  (kwUSE_INDEX)
  (kwUSE_WIDGET_POOL)
  (kwUSING)
  (kwVALIDATE)
  (kwVARIABLE)
  (kwVIEW_AS)
  (kwVOID)
  (kwWARNING)
  (kwWHEN)
  (kwWINDOW)
  (kwWORD_INDEX)
  (kwXML_NODE_NAME)
  (kwYES_NO)
(kwYES_NO_CANCEL)
] @keyword
