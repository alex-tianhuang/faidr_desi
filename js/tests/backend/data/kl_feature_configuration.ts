// Written by Claude Code, migrated from Khaled's old design code.
//
// Legacy feature configuration — drop-in replacement for current app's
// FEATURE_CONFIGURATION.

// I thought I would be able to get Claude to inline them
// based on the feature IDs but it turns out Khaled compiled
// his regex patterns in a non-trivial (not directly from name).
// So here is a hard-coded table of motifs.
const LEGACY_MOTIFS = {
  "id=DEG_APCC_DBOX_1 m=.R..L..[LIVM].": ".R..L..[LIVM].",
  "id=DEG_APCC_KENBOX_2 m=.KEN.": ".KEN.",
  "id=DOC_MAPK_MEF2A_6 m=[LIVMP].[LIV].[LIVMF]": "[LIVMP].[LIV].[LIVMF]",
  "id=DOC_CYCLIN_RxL_1 m=[^EDWNSG][^D][RK][^D]L":
    "[ACFHIKLMPQRTVY][ACEFGHIKLMNPQRSTVWY][RK][ACEFGHIKLMNPQRSTVWY]L",
  "id=DOC_MAPK_FxFP_2 m=F.[FY]P ": "F.[FY]P",
  "id=DOC_PP2A_B56_1 m=[LM]..[IL].E": "[LM]..[IL].E",
  "id=DOC_PP2B_PxIxI_1 m=.P[^P]I[^P][IV][^P]":
    ".P[ACDEFGHIKLMNQRSTVWY]I[ACDEFGHIKLMNQRSTVWY][IV][ACDEFGHIKLMNQRSTVWY]",
  "id=LIG_14-3-3_CanoR_1 m=R..[ST].P": "R..[ST].P",
  "id=LIG_CaM_IQ_9 m=[ACLIVTM][^P][^P][ILVMFCT]Q[^P][^P][^P][RK][^P][^P][^P][^P][RKQ]":
    "[ACLIVTM][ACDEFGHIKLMNQRSTVWY][ACDEFGHIKLMNQRSTVWY][ILVMFCT]Q[ACDEFGHIKLMNQRSTVWY][ACDEFGHIKLMNQRSTVWY][ACDEFGHIKLMNQRSTVWY][RK][ACDEFGHIKLMNQRSTVWY][ACDEFGHIKLMNQRSTVWY][ACDEFGHIKLMNQRSTVWY][ACDEFGHIKLMNQRSTVWY][RKQ]",
  "id=LIG_EH_1 m=.NPF.": ".NPF.",
  "id=LIG_eIF4E_1 m=Y....L[VILMF]": "Y....L[VILMF]",
  "id=LIG_EVH1_1 m=[FYWL]P.PP": "[FYWL]P.PP",
  "id=LIG_NRBOX m=[^P]L[^P][^P]LL[^P]":
    "[ACDEFGHIKLMNQRSTVWY]L[ACDEFGHIKLMNQRSTVWY][ACDEFGHIKLMNQRSTVWY]LL[ACDEFGHIKLMNQRSTVWY]",
  "id=LIG_PCNA_PIPBox_1 m=Q.[^FHWY][ILM][^P][^FHILVWYP][HFM][FMY].. ":
    "Q.[ACDEGIKLMNPQRSTV][ILM][ACDEFGHIKLMNQRSTVWY][ACDEGKMNQRST][HFM][FMY]..",
  "id=LIG_PDZ_Class_1 m=...[ST].[ACVILF]$ ": "...[ST].[ACVILF]$",
  "id=LIG_PROFILIN_1 m=PPP[PA]P[LGP][LGP]":
    "PPP[PA]P[LGP][LGP][ACDEFGHIKLMNQRSTVWY]",
  "id=LIG_SH2_SRC m=(Y)[QDEVAIL][DENPYHI][IPVGAHS] ":
    "Y[QDEVAIL][DENPYHI][IPVGAHS]",
  "id=LIG_SH2_GRB2 m=(Y).N.": "Y.N.",
  "id=LIG_SH3_1 m=[RKY]..P..P": "[RKY]..P..P",
  "id=LIG_SH3_2 m=P..P.[KR]": "P..P.[KR]",
  "id=LIG_WW_1 m=PP.Y": "PP.Y",
  "id=LIG_LIR_Gen_1 m=[WFY]..[ILV]": "[WFY]..[ILV]",
  "id=LIG_AP_GAE_1 m=[DE][DES][DEGAS]F[SGAD][DEAP][LVIMFD]":
    "[DE][DES][DEGAS]F[SGAD][DEAP][LVIMFD]",
  "id=MOD_CAAXbox m=(C)[^DENQ][LIVMF].$": "C[ACFGHIKLMPRSTVWY][LIVMF].$",
  "id=MOD_CDK_SPxK_1 m=...([ST])P.[KR]": "...[ST]P.[KR]",
  "id=MOD_CDK_SPxxK_3 m=...([ST])P..[RK] ": "...[ST]P..[RK]",
  "id=MOD_CDC7_priming m=S[ST]P": "S[ST]P",
  "id=MOD_CDK_STP m=[ST]P": "[ST]P",
  "id=MOD_CKII m=[ST][DE].[DE]": "[ST][DE].[DE]",
  "id=MOD_GSK3_1 m=...([ST])...[ST] ": "...[ST]...[ST][ACDEFGHIKLMNPQRVWY]",
  "id=MOD_LATS_1 m=H.[KR]..([ST])[^P]": "H.[KR]..[ST][ACDEFGHIKLMNQRSTVWY]",
  "id=MOD_PIKK_1 m=[ST]Q": "[ST]Q",
  "id=MOD_N-GLC_1  m=.(N)[^P][ST]..": ".N[ACDEFGHIKLMNQRSTVWY][ST]..",
  "id=MOD_PKA_1 m=[RK][RK].([ST])[^P]..":
    "[RK][RK].[ST][ACDEFGHIKLMNQRSTVWY]..",
  "id=MOD_PKB_1 m=R.R..([ST])[^P]..": "R.R..[ST][ACDEFGHIKLMNQRSTVWY]..",
  "id=MOD_Plk_1 m=[DNE][^PG][ST]": "[DNE][ACDEFHIKLMNQRSTVWY][ST]",
  "id=MOD_PRK1 m=[LIVM]....TG": "[LIVM]....TG",
  "id=MOD_ERK1 m=P.[ST]P": "P.[ST]P",
  "id=MOD_SUMO_for_1 m=[VILMAFP](K).E": "[VILMAFP]K.E",
  "id=TRG_NLS_MonoCore_2 m=[^DE]K[RK][KRP][KR][^DE] ":
    "[ACFGHIKLMNPQRSTVWY]K[RK][KRP][KR][ACFGHIKLMNPQRSTVWY]",
  "id=TRG_ER_KDEL_1 m=[KRHQSAP][DENQT]EL$": "[KRHQSAP][DENQT]EL$",
  "id=TRG_Golgi_diPhe_1 m=Q......FF": "Q......FF",
  "id=TRG_ER_FFAT_1 m=E[FY][FYK]DA.[ESTD] ": "E[FY][FYK]DA.[ESTD]",
  "id=INT_RGG m=RGG": "RGG",
  "id=TRG_FG m=[FG].FG": "[FG].FG",
  "id=INT_FRG m=[FR]G": "[FR]G",
  "id=INT_SGFYSG m=[SG][FY][SG]": "[SG][FY][SG]",
  "id=PG_rich m=G..[GP][PG]": "[G]..[GP][PG]",
  "id=LARKS m=[SG]Y[SG][SG]Y[SG]": "[SG]Y[SG][SG]Y[SG]",
  "id=ELASTIN_LIKE m=VPG.G": "VPG.G",
  "id=INT_FGDF m=FGDF": "FGDF",
  "id=R_plus_Y m=[RY]": "[RY]",
  "id=AA_S m=S": "S[ACDEFGHIKLMNPQRTVWY]",
  "id=AA_P m=P": "P[ACDEFGHIKLMNQRSTVWY]",
  "id=AA_T m=T": "T[ACDEFGHIKLMNPQRSVWY]",
  "id=AA_A m=A": "A[CDEFGHIKLMNPQRSTVWY]",
  "id=AA_H m=H": "H[ACDEFGIKLMNPQRSTVWY]",
  "id=AA_Q m=Q": "Q[ACDEFGHIKLMNPRSTVWY]",
  "id=AA_N m=N": "N[ACDEFGHIKLMPQRSTVWY]",
  "id=AA_G m=G": "G[ACDEFHIKLMNPQRSTVWY]",
  "id=AA_R m=R": "R[ACDEFGHIKLMNPQSTVWY]",
  "id=acidic m=[DE]": "[DE]",
  "id=basic m=[RK]": "[RK]",
  "id=aliphatic m=[ALMIV]": "[ALMIV]",
  "id=polar_fraction m=[QNSTGCH]": "[QNSTGCH]",
  "id=chain_expanding m=[EDRKP]": "[EDRKP]",
  "id=aromatic m=[FYW]": "[FYW]",
  "id=disorder_promoting m=[TAGRDHQKSEP]": "[TAGRDHQKSEP]",
};
export default {
  // ── Scalar sequence features (indices 0–9) ────────────────────────────────

  SCD: {
    compute: "scd",
  },

  my_kappa: {
    compute: "simple-spacing-delta",
    resGroupA: "DE",
    resGroupB: "KR",
    blobSize: 5,
  },

  my_omega: {
    compute: "simple-spacing-omega",
    resGroup: "DEKRP",
    blobSize: 5,
  },

  ED_ratio: {
    compute: "log-ratio",
    numerator: "E",
    denominator: "D",
  },

  FCR: {
    compute: "percent-res-group",
    resGroup: "DEKR",
  },

  KL_hydropathy: {
    compute: "simple-score",
    weights: {
      A: 1.8,
      C: 2.5,
      D: -3.5,
      E: -3.5,
      F: 2.8,
      G: -0.4,
      H: -3.2,
      I: 4.5,
      K: -3.9,
      L: 3.8,
      M: 1.9,
      N: -3.5,
      P: -1.6,
      Q: -3.5,
      R: -4.5,
      S: -0.8,
      T: -0.7,
      V: 4.2,
      W: -0.9,
      Y: -1.3,
    },
    takeAverage: true,
  },

  RK_ratio: {
    compute: "log-ratio",
    numerator: "R",
    denominator: "K",
  },

  WF_complexity: {
    compute: "sequence-complexity",
  },

  isoelectric_point: {
    compute: "isoelectric-point",
  },

  net_charge: {
    compute: "simple-score",
    weights: {
      D: -1,
      E: -1,
      K: 1,
      R: 1,
    },
    takeAverage: false,
  },

  // ── Per-residue percentages (indices 10–18) ───────────────────────────────

  "id=AA_A m=A": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=AA_A m=A"],
    takeAverage: false,
  },
  "id=AA_G m=G": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=AA_G m=G"],
    takeAverage: false,
  },
  "id=AA_H m=H": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=AA_H m=H"],
    takeAverage: false,
  },
  "id=AA_N m=N": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=AA_N m=N"],
    takeAverage: false,
  },
  "id=AA_P m=P": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=AA_P m=P"],
    takeAverage: false,
  },
  "id=AA_Q m=Q": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=AA_Q m=Q"],
    takeAverage: false,
  },
  "id=AA_R m=R": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=AA_R m=R"],
    takeAverage: false,
  },
  "id=AA_S m=S": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=AA_S m=S"],
    takeAverage: false,
  },
  "id=AA_T m=T": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=AA_T m=T"],
    takeAverage: false,
  },

  // ── Motif features (indices 19–64) ───────────────────────────────────────

  "id=DEG_APCC_DBOX_1 m=.R..L..[LIVM].": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=DEG_APCC_DBOX_1 m=.R..L..[LIVM]."],
    takeAverage: false,
  },

  "id=DEG_APCC_KENBOX_2 m=.KEN.": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=DEG_APCC_KENBOX_2 m=.KEN."],
    takeAverage: false,
  },

  "id=DOC_CYCLIN_RxL_1 m=[^EDWNSG][^D][RK][^D]L": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=DOC_CYCLIN_RxL_1 m=[^EDWNSG][^D][RK][^D]L"],
    takeAverage: false,
  },

  "id=DOC_MAPK_FxFP_2 m=F.[FY]P ": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=DOC_MAPK_FxFP_2 m=F.[FY]P "],
    takeAverage: false,
  },

  "id=DOC_MAPK_MEF2A_6 m=[LIVMP].[LIV].[LIVMF]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=DOC_MAPK_MEF2A_6 m=[LIVMP].[LIV].[LIVMF]"],
    takeAverage: false,
  },

  "id=DOC_PP2A_B56_1 m=[LM]..[IL].E": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=DOC_PP2A_B56_1 m=[LM]..[IL].E"],
    takeAverage: false,
  },

  "id=DOC_PP2B_PxIxI_1 m=.P[^P]I[^P][IV][^P]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=DOC_PP2B_PxIxI_1 m=.P[^P]I[^P][IV][^P]"],
    takeAverage: false,
  },

  "id=ELASTIN_LIKE m=VPG.G": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=ELASTIN_LIKE m=VPG.G"],
    takeAverage: false,
  },

  "id=INT_FGDF m=FGDF": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=INT_FGDF m=FGDF"],
    takeAverage: false,
  },

  "id=INT_FRG m=[FR]G": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=INT_FRG m=[FR]G"],
    takeAverage: false,
  },

  "id=INT_RGG m=RGG": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=INT_RGG m=RGG"],
    takeAverage: false,
  },

  "id=INT_SGFYSG m=[SG][FY][SG]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=INT_SGFYSG m=[SG][FY][SG]"],
    takeAverage: false,
  },

  "id=LARKS m=[SG]Y[SG][SG]Y[SG]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LARKS m=[SG]Y[SG][SG]Y[SG]"],
    takeAverage: false,
  },

  "id=LIG_14-3-3_CanoR_1 m=R..[ST].P": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_14-3-3_CanoR_1 m=R..[ST].P"],
    takeAverage: false,
  },

  "id=LIG_AP_GAE_1 m=[DE][DES][DEGAS]F[SGAD][DEAP][LVIMFD]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_AP_GAE_1 m=[DE][DES][DEGAS]F[SGAD][DEAP][LVIMFD]"],
    takeAverage: false,
  },

  "id=LIG_CaM_IQ_9 m=[ACLIVTM][^P][^P][ILVMFCT]Q[^P][^P][^P][RK][^P][^P][^P][^P][RKQ]":
    {
      compute: "regex-motif-count",
      pattern:
        LEGACY_MOTIFS["id=LIG_CaM_IQ_9 m=[ACLIVTM][^P][^P][ILVMFCT]Q[^P][^P][^P][RK][^P][^P][^P][^P][RKQ]"],
      takeAverage: false,
    },

  "id=LIG_EH_1 m=.NPF.": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_EH_1 m=.NPF."],
    takeAverage: false,
  },

  "id=LIG_EVH1_1 m=[FYWL]P.PP": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_EVH1_1 m=[FYWL]P.PP"],
    takeAverage: false,
  },

  "id=LIG_LIR_Gen_1 m=[WFY]..[ILV]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_LIR_Gen_1 m=[WFY]..[ILV]"],
    takeAverage: false,
  },

  "id=LIG_NRBOX m=[^P]L[^P][^P]LL[^P]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_NRBOX m=[^P]L[^P][^P]LL[^P]"],
    takeAverage: false,
  },

  "id=LIG_PCNA_PIPBox_1 m=Q.[^FHWY][ILM][^P][^FHILVWYP][HFM][FMY].. ": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_PCNA_PIPBox_1 m=Q.[^FHWY][ILM][^P][^FHILVWYP][HFM][FMY].. "],
    takeAverage: false,
  },

  "id=LIG_PDZ_Class_1 m=...[ST].[ACVILF]$ ": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_PDZ_Class_1 m=...[ST].[ACVILF]$ "],
    takeAverage: false,
  },

  "id=LIG_PROFILIN_1 m=PPP[PA]P[LGP][LGP]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_PROFILIN_1 m=PPP[PA]P[LGP][LGP]"],
    takeAverage: false,
  },

  "id=LIG_SH2_GRB2 m=(Y).N.": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_SH2_GRB2 m=(Y).N."],
    takeAverage: false,
  },

  "id=LIG_SH2_SRC m=(Y)[QDEVAIL][DENPYHI][IPVGAHS] ": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_SH2_SRC m=(Y)[QDEVAIL][DENPYHI][IPVGAHS] "],
    takeAverage: false,
  },

  "id=LIG_SH3_1 m=[RKY]..P..P": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_SH3_1 m=[RKY]..P..P"],
    takeAverage: false,
  },

  "id=LIG_SH3_2 m=P..P.[KR]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_SH3_2 m=P..P.[KR]"],
    takeAverage: false,
  },

  "id=LIG_WW_1 m=PP.Y": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_WW_1 m=PP.Y"],
    takeAverage: false,
  },

  "id=LIG_eIF4E_1 m=Y....L[VILMF]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=LIG_eIF4E_1 m=Y....L[VILMF]"],
    takeAverage: false,
  },

  "id=MOD_CAAXbox m=(C)[^DENQ][LIVMF].$": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_CAAXbox m=(C)[^DENQ][LIVMF].$"],
    takeAverage: false,
  },

  "id=MOD_CDC7_priming m=S[ST]P": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_CDC7_priming m=S[ST]P"],
    takeAverage: false,
  },

  "id=MOD_CDK_SPxK_1 m=...([ST])P.[KR]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_CDK_SPxK_1 m=...([ST])P.[KR]"],
    takeAverage: false,
  },

  "id=MOD_CDK_SPxxK_3 m=...([ST])P..[RK] ": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_CDK_SPxxK_3 m=...([ST])P..[RK] "],
    takeAverage: false,
  },

  "id=MOD_CDK_STP m=[ST]P": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_CDK_STP m=[ST]P"],
    takeAverage: false,
  },

  "id=MOD_CKII m=[ST][DE].[DE]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_CKII m=[ST][DE].[DE]"],
    takeAverage: false,
  },

  "id=MOD_ERK1 m=P.[ST]P": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_ERK1 m=P.[ST]P"],
    takeAverage: false,
  },

  "id=MOD_GSK3_1 m=...([ST])...[ST] ": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_GSK3_1 m=...([ST])...[ST] "],
    takeAverage: false,
  },

  "id=MOD_LATS_1 m=H.[KR]..([ST])[^P]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_LATS_1 m=H.[KR]..([ST])[^P]"],
    takeAverage: false,
  },

  "id=MOD_N-GLC_1  m=.(N)[^P][ST]..": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_N-GLC_1  m=.(N)[^P][ST].."],
    takeAverage: false,
  },

  "id=MOD_PIKK_1 m=[ST]Q": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_PIKK_1 m=[ST]Q"],
    takeAverage: false,
  },

  "id=MOD_PKA_1 m=[RK][RK].([ST])[^P]..": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_PKA_1 m=[RK][RK].([ST])[^P].."],
    takeAverage: false,
  },

  "id=MOD_PKB_1 m=R.R..([ST])[^P]..": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_PKB_1 m=R.R..([ST])[^P].."],
    takeAverage: false,
  },

  "id=MOD_PRK1 m=[LIVM]....TG": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_PRK1 m=[LIVM]....TG"],
    takeAverage: false,
  },

  "id=MOD_Plk_1 m=[DNE][^PG][ST]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_Plk_1 m=[DNE][^PG][ST]"],
    takeAverage: false,
  },

  "id=MOD_SUMO_for_1 m=[VILMAFP](K).E": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=MOD_SUMO_for_1 m=[VILMAFP](K).E"],
    takeAverage: false,
  },

  "id=PG_rich m=G..[GP][PG]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=PG_rich m=G..[GP][PG]"],
    takeAverage: false,
  },

  // ── Repeat features (indices 65–80) ──────────────────────────────────────

  'id=REP_D2 m="D{2,}"': {
    compute: "repeat-span",
    resGroup: "D",
    takeAverage: false,
  },
  'id=REP_E2 m="E{2,}"': {
    compute: "repeat-span",
    resGroup: "E",
    takeAverage: false,
  },
  'id=REP_FG2 m="[FG]{2,}"': {
    compute: "repeat-span",
    resGroup: "FG",
    takeAverage: false,
  },
  'id=REP_G2 m="G{2,}"': {
    compute: "repeat-span",
    resGroup: "G",
    takeAverage: false,
  },
  'id=REP_K2 m="K{2,}"': {
    compute: "repeat-span",
    resGroup: "K",
    takeAverage: false,
  },
  'id=REP_KAP2 m="[KAP]{2,}"': {
    compute: "repeat-span",
    resGroup: "KAP",
    takeAverage: false,
  },
  'id=REP_N2 m="N{2,}"': {
    compute: "repeat-span",
    resGroup: "N",
    takeAverage: false,
  },
  'id=REP_P2 m="P{2,}"': {
    compute: "repeat-span",
    resGroup: "P",
    takeAverage: false,
  },
  'id=REP_PTS2 m="[PTS]{2,}"': {
    compute: "repeat-span",
    resGroup: "PTS",
    takeAverage: false,
  },
  'id=REP_Q2 m="Q{2,}"': {
    compute: "repeat-span",
    resGroup: "Q",
    takeAverage: false,
  },
  'id=REP_QN2 m="[QN]{2,}"': {
    compute: "repeat-span",
    resGroup: "QN",
    takeAverage: false,
  },
  'id=REP_R2 m="R{2,}"': {
    compute: "repeat-span",
    resGroup: "R",
    takeAverage: false,
  },
  'id=REP_RG2 m="[RG]{2,}"': {
    compute: "repeat-span",
    resGroup: "RG",
    takeAverage: false,
  },
  'id=REP_S2 m="S{2,}"': {
    compute: "repeat-span",
    resGroup: "S",
    takeAverage: false,
  },
  'id=REP_SG2 m="[SG]{2,}"': {
    compute: "repeat-span",
    resGroup: "SG",
    takeAverage: false,
  },
  'id=REP_SR2 m="[SR]{2,}"': {
    compute: "repeat-span",
    resGroup: "SR",
    takeAverage: false,
  },

  // ── index 81 ─────────────────────────────────────────────────────────────

  "id=R_plus_Y m=[RY]": {
    compute: "regex-motif-count",
    pattern: "[RY]",
    takeAverage: false,
  },

  // ── TRG features (indices 82–86) ─────────────────────────────────────────

  "id=TRG_ER_FFAT_1 m=E[FY][FYK]DA.[ESTD] ": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=TRG_ER_FFAT_1 m=E[FY][FYK]DA.[ESTD] "],
    takeAverage: false,
  },

  "id=TRG_ER_KDEL_1 m=[KRHQSAP][DENQT]EL$": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=TRG_ER_KDEL_1 m=[KRHQSAP][DENQT]EL$"],
    takeAverage: false,
  },

  "id=TRG_FG m=[FG].FG": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=TRG_FG m=[FG].FG"],
    takeAverage: false,
  },

  "id=TRG_Golgi_diPhe_1 m=Q......FF": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=TRG_Golgi_diPhe_1 m=Q......FF"],
    takeAverage: false,
  },

  "id=TRG_NLS_MonoCore_2 m=[^DE]K[RK][KRP][KR][^DE] ": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=TRG_NLS_MonoCore_2 m=[^DE]K[RK][KRP][KR][^DE] "],
    takeAverage: false,
  },

  // ── Residue group fractions (indices 87–93) ───────────────────────────────

  "id=acidic m=[DE]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=acidic m=[DE]"],
    takeAverage: false,
  },

  "id=aliphatic m=[ALMIV]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=aliphatic m=[ALMIV]"],
    takeAverage: false,
  },

  "id=aromatic m=[FYW]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=aromatic m=[FYW]"],
    takeAverage: false,
  },

  "id=basic m=[RK]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=basic m=[RK]"],
    takeAverage: false,
  },

  "id=chain_expanding m=[EDRKP]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=chain_expanding m=[EDRKP]"],
    takeAverage: false,
  },

  "id=disorder_promoting m=[TAGRDHQKSEP]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=disorder_promoting m=[TAGRDHQKSEP]"],
    takeAverage: false,
  },

  "id=polar_fraction m=[QNSTGCH]": {
    compute: "regex-motif-count",
    pattern: LEGACY_MOTIFS["id=polar_fraction m=[QNSTGCH]"],
    takeAverage: false,
  },
};
