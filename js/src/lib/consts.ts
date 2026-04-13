import {
  FEATURE_MINIMUMS as YEAST_FEATURE_MINIMUMS,
  FEATURE_WEIGHTS as YEAST_FEATURE_WEIGHTS,
  FEATURE_MEANS as YEAST_FEATURE_MEANS,
} from "./featureConfiguration/yeast";
import {
  FEATURE_MINIMUMS as HUMAN_FEATURE_MINIMUMS,
  FEATURE_WEIGHTS as HUMAN_FEATURE_WEIGHTS,
  FEATURE_MEANS as HUMAN_FEATURE_MEANS,
} from "./featureConfiguration/human";
/** The minimum sequence length good enough
 * for the scope of this project. */
export const MIN_SEQUENCE_LENGTH = 5;
/** Sequence validation parameters good enough
 * for the scope of this project.
 */
export const SEQUENCE_VALIDATION_PARAMETERS = {
  minSequenceLength: MIN_SEQUENCE_LENGTH,
  omitMode: "strict",
  capitalizeMode: "strict",
};
/** IDRomes used as feature weights, means, or minimums. */
export type IDRome = "yeast" | "human";
/** Feature minimums over different IDRomes for KO design. */
export const FEATURE_MINIMUMS: Record<IDRome, Record<string, number>> = {
  yeast: YEAST_FEATURE_MINIMUMS,
  human: HUMAN_FEATURE_MINIMUMS,
};
/** Feature means over different IDRomes for Z-score computation. */
export const FEATURE_MEANS_FOR_ZSCORE: Record<IDRome, Record<string, number>> = {
  yeast: YEAST_FEATURE_MEANS,
  human: HUMAN_FEATURE_MEANS,
};
/** Feature inverse standard deviations over different IDRomes
 * to be used as design weights. */
export const FEATURE_WEIGHTS: Record<IDRome, Record<string, number>> = {
  yeast: YEAST_FEATURE_WEIGHTS,
  human: HUMAN_FEATURE_WEIGHTS,
};
/** Sequence feature configuration good enough for the scope of this project. */
export const FEATURE_CONFIGURATION = {
  AA_A: {
    compute: "percent-residue",
    residue: "A",
  },
  AA_C: {
    compute: "percent-residue",
    residue: "C",
  },
  AA_D: {
    compute: "percent-residue",
    residue: "D",
  },
  AA_E: {
    compute: "percent-residue",
    residue: "E",
  },
  AA_F: {
    compute: "percent-residue",
    residue: "F",
  },
  AA_G: {
    compute: "percent-residue",
    residue: "G",
  },
  AA_H: {
    compute: "percent-residue",
    residue: "H",
  },
  AA_I: {
    compute: "percent-residue",
    residue: "I",
  },
  AA_K: {
    compute: "percent-residue",
    residue: "K",
  },
  AA_L: {
    compute: "percent-residue",
    residue: "L",
  },
  AA_M: {
    compute: "percent-residue",
    residue: "M",
  },
  AA_N: {
    compute: "percent-residue",
    residue: "N",
  },
  AA_P: {
    compute: "percent-residue",
    residue: "P",
  },
  AA_Q: {
    compute: "percent-residue",
    residue: "Q",
  },
  AA_R: {
    compute: "percent-residue",
    residue: "R",
  },
  AA_S: {
    compute: "percent-residue",
    residue: "S",
  },
  AA_T: {
    compute: "percent-residue",
    residue: "T",
  },
  AA_V: {
    compute: "percent-residue",
    residue: "V",
  },
  AA_W: {
    compute: "percent-residue",
    residue: "W",
  },
  AA_Y: {
    compute: "percent-residue",
    residue: "Y",
  },
  "CLV_C14_Caspase3-7": {
    compute: "regex-motif-count",
    pattern: "[DSTE][^P][^DEWHFYC]D[GSAN]",
    takeAverage: false,
  },
  DEG_APCC_KENBOX_2: {
    compute: "regex-motif-count",
    pattern: ".KEN.",
    takeAverage: false,
  },
  DEG_Kelch_Keap1_1: {
    compute: "regex-motif-count",
    pattern: "[DNS].[DES][TNS]GE",
    takeAverage: false,
  },
  DEG_SCF_TRCP1_1: {
    compute: "regex-motif-count",
    pattern: "D(S)G.{2,3}([ST])",
    takeAverage: false,
  },
  DOC_ANK_TNKS_1: {
    compute: "regex-motif-count",
    pattern: ".R..[PGAV][DEIP]G.",
    takeAverage: false,
  },
  DOC_CYCLIN_RxL_1: {
    compute: "regex-motif-count",
    pattern: "(.|([KRH].{0,3}))[^EDWNSG][^D][RK][^D]L.{0,1}[FLMP].{0,3}[EDST]",
    takeAverage: false,
  },
  DOC_MAPK_JIP1_4: {
    compute: "regex-motif-count",
    pattern: "[RK]P[^P][^P]L.[LIVMF]",
    takeAverage: false,
  },
  DOC_MAPK_MEF2A_6: {
    compute: "regex-motif-count",
    pattern: "[RK].{2,4}[LIVMP].[LIV].[LIVMF]",
    takeAverage: false,
  },
  DOC_MAPK_NFAT4_5: {
    compute: "regex-motif-count",
    pattern: "[RK][^P][^P][LIM].L.[LIVMF].",
    takeAverage: false,
  },
  DOC_MAPK_gen_1: {
    compute: "regex-motif-count",
    pattern: "[KR]{0,2}[KR].{0,2}[KR].{2,4}[ILVM].[ILVF]",
    takeAverage: false,
  },
  DOC_PP1_RVXF_1: {
    compute: "regex-motif-count",
    pattern: "..[RK].{0,1}[VIL][^P][FW].",
    takeAverage: false,
  },
  DOC_PP2A_B56_1: {
    compute: "regex-motif-count",
    pattern: "([LMFYWIC]..I.E)|(L..[IVLWC].E).",
    takeAverage: false,
  },
  DOC_PP4_FxxP_1: {
    compute: "regex-motif-count",
    pattern: "F..P",
    takeAverage: false,
  },
  DOC_WW_Pin1_4: {
    compute: "regex-motif-count",
    pattern: "...([ST])P.",
    takeAverage: false,
  },
  D_repeats: {
    compute: "repeat-span",
    resGroup: "D",
    takeAverage: false,
  },
  ED_ratio: {
    compute: "log-ratio",
    numerator: "E",
    denominator: "D",
  },
  ELASTIN_LIKE: {
    compute: "regex-motif-span",
    pattern: "VPG.G",
    takeAverage: false,
  },
  E_repeats: {
    compute: "repeat-span",
    resGroup: "E",
    takeAverage: false,
  },
  FG_repeats: {
    compute: "repeat-span",
    resGroup: "FG",
    takeAverage: false,
  },
  FG_rich: {
    compute: "regex-motif-span",
    pattern: "[FG].FG",
    takeAverage: false,
  },
  FGxF: {
    compute: "regex-motif-span",
    pattern: "FG.F",
    takeAverage: false,
  },
  FRG: {
    compute: "regex-motif-span",
    pattern: "[FR]G",
    takeAverage: false,
  },
  G_repeats: {
    compute: "repeat-span",
    resGroup: "G",
    takeAverage: false,
  },
  KAP_repeats: {
    compute: "repeat-span",
    resGroup: "KAP",
    takeAverage: false,
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
  K_repeats: {
    compute: "repeat-span",
    resGroup: "K",
    takeAverage: false,
  },
  "LIG_14-3-3_CanoR_1": {
    compute: "regex-motif-count",
    pattern:
      "R[^DE]{0,2}[^DEPG]([ST])(([FWYLMV].)|([^PRIKGN]P)|([^PRIKGN].{2,4}[VILMFWYP]))",
    takeAverage: false,
  },
  LIG_CaM_IQ_9: {
    compute: "regex-motif-count",
    pattern:
      "[ACLIVTM][^P][^P][ILVMFCT]Q[^P][^P][^P][RK][^P]{4,5}[RKQ][^P][^P]",
    takeAverage: false,
  },
  LIG_CtBP_PxDLS_1: {
    compute: "regex-motif-count",
    pattern:
      "(P[LVIPME][DENS][LM][VASTRG])|(G[LVIPME][DENS][LM][VASTRG]((K)|(.[KR])))",
    takeAverage: false,
  },
  LIG_EF_ALG2_ABM_1: {
    compute: "regex-motif-count",
    pattern: "P[PG]{0,1}YP.{1,6}Y[QS]{0,1}P",
    takeAverage: false,
  },
  LIG_EH_1: {
    compute: "regex-motif-count",
    pattern: ".NPF.",
    takeAverage: false,
  },
  "LIG_HCF-1_HBM_1": {
    compute: "regex-motif-count",
    pattern: "[DE]H.Y",
    takeAverage: false,
  },
  LIG_HOMEOBOX: {
    compute: "regex-motif-count",
    pattern: "[FY][DEP]WM",
    takeAverage: false,
  },
  LIG_KEPE_2: {
    compute: "regex-motif-count",
    pattern: "[VILMFT]K.EP.{2,3}[DE]",
    takeAverage: false,
  },
  LIG_KLC1_WD_1: {
    compute: "regex-motif-count",
    pattern: "[LMTAFSRI][^KRG]W[DE].{3,5}[LIVMFPA]",
    takeAverage: false,
  },
  LIG_LIR_Gen_1: {
    compute: "regex-motif-count",
    pattern: "[EDST].{0,2}[WFY][^RKPG][^PG][ILV]",
    takeAverage: false,
  },
  LIG_PAM2_1: {
    compute: "regex-motif-count",
    pattern: "..[LFP][NS][PIVTAFL].A..(([FY].[PYLF])|(W..)).",
    takeAverage: false,
  },
  LIG_PCNA_PIPBox_1: {
    compute: "regex-motif-count",
    pattern: "[QM].[^FHWY][LIVM][^P][^PFWYMLIV](([FYHL][FYW])|([FYH][FYWL]))..",
    takeAverage: false,
  },
  LIG_PDZ_Class_1: {
    compute: "regex-motif-count",
    pattern: "...[ST].[ACVILF]$",
    takeAverage: false,
  },
  LIG_PDZ_Wminus1_1: {
    compute: "regex-motif-count",
    pattern: ".W[ACGILV]$",
    takeAverage: false,
  },
  LIG_PTAP_UEV_1: {
    compute: "regex-motif-count",
    pattern: ".P[TS]AP.",
    takeAverage: false,
  },
  LIG_PTB_Apo_2: {
    compute: "regex-motif-count",
    pattern: "(.[^P].NP.[FY].)|(.[ILVMFY].N..[FY].)",
    takeAverage: false,
  },
  LIG_PTB_Phospho_1: {
    compute: "regex-motif-count",
    pattern: "(.[^P].NP.(Y))|(.[ILVMFY].N..(Y))",
    takeAverage: false,
  },
  LIG_Rb_LxCxE_1: {
    compute: "regex-motif-count",
    pattern: "([DEST]|^).{0,4}[LI].C.E.{1,4}[FLMIVAWPHY].{0,8}([DEST]|$)",
    takeAverage: false,
  },
  LIG_SH2_CRK: {
    compute: "regex-motif-count",
    pattern: "(Y)[^EPILVFYW][^HDEW][PLIV][^DEW]",
    takeAverage: false,
  },
  LIG_SH2_GRB2like: {
    compute: "regex-motif-count",
    pattern: "(Y)([EDST]|[MLIVAFYHQW])N.",
    takeAverage: false,
  },
  LIG_SH2_NCK_1: {
    compute: "regex-motif-count",
    pattern: "(Y)[DESTNA][^GWFY][VPAI][DENQSTAGYFP]",
    takeAverage: false,
  },
  LIG_SH2_SRC: {
    compute: "regex-motif-count",
    pattern: "(Y)[QDEVAIL][DENPYHI][IPVGAHS]",
    takeAverage: false,
  },
  LIG_SH2_STAP1: {
    compute: "regex-motif-count",
    pattern: "(Y)[DESTA][^GP][^GP][ILVFMWYA]",
    takeAverage: false,
  },
  LIG_SH2_STAT5: {
    compute: "regex-motif-count",
    pattern: "(Y)[VLTFIC]..",
    takeAverage: false,
  },
  LIG_SH3_2: {
    compute: "regex-motif-count",
    pattern: "P..P.[KR]",
    takeAverage: false,
  },
  LIG_SUMO_SIM_anti_2: {
    compute: "regex-motif-count",
    pattern: "[DEST]{1,10}.{0,1}[VIL][DESTVILMA][VIL][VILM].[DEST]{0,5}",
    takeAverage: false,
  },
  LIG_SUMO_SIM_par_1: {
    compute: "regex-motif-count",
    pattern: "[DEST]{0,5}.[VILPTM][VIL][DESTVILMA][VIL].{0,1}[DEST]{1,10}",
    takeAverage: false,
  },
  MOD_CDK_SPK_2: {
    compute: "regex-motif-count",
    pattern: "...([ST])P[RK]",
    takeAverage: false,
  },
  MOD_CDK_SPxK_1: {
    compute: "regex-motif-count",
    pattern: "...([ST])P.[KR]",
    takeAverage: false,
  },
  MOD_CDK_SPxxK_3: {
    compute: "regex-motif-count",
    pattern: "...([ST])P..[RK]",
    takeAverage: false,
  },
  MOD_CK1_1: {
    compute: "regex-motif-count",
    pattern: "S..([ST])...",
    takeAverage: false,
  },
  MOD_CK2_1: {
    compute: "regex-motif-count",
    pattern: "...([ST])..E",
    takeAverage: false,
  },
  MOD_DYRK1A_RPxSP_1: {
    compute: "regex-motif-count",
    pattern: "R[PSVA].([ST])P",
    takeAverage: false,
  },
  MOD_GSK3_1: {
    compute: "regex-motif-count",
    pattern: "...([ST])...[ST]",
    takeAverage: false,
  },
  "MOD_N-GLC_1": {
    compute: "regex-motif-count",
    pattern: ".(N)[^P][ST]..",
    takeAverage: false,
  },
  MOD_NMyristoyl: {
    compute: "regex-motif-count",
    pattern: "^M{0,1}(G)[^EDRKHPFYW]..[STAGCN][^P]",
    takeAverage: false,
  },
  MOD_PIKK_1: {
    compute: "regex-motif-count",
    pattern: "...([ST])Q..",
    takeAverage: false,
  },
  MOD_PKA_1: {
    compute: "regex-motif-count",
    pattern: "[RK][RK].([ST])[^P]..",
    takeAverage: false,
  },
  MOD_PKA_2: {
    compute: "regex-motif-count",
    pattern: ".R.([ST])[^P]..",
    takeAverage: false,
  },
  MOD_PKB_1: {
    compute: "regex-motif-count",
    pattern: "R.R..([ST])[^P]..",
    takeAverage: false,
  },
  MOD_Plk_1: {
    compute: "regex-motif-count",
    pattern: ".[DNE][^PG][ST](([FYILMVW]..)|([^PEDGKN][FWYLIVM]).)",
    takeAverage: false,
  },
  MOD_ProDKin_1: {
    compute: "regex-motif-count",
    pattern: "...([ST])P..",
    takeAverage: false,
  },
  MOD_SUMO_for_1: {
    compute: "regex-motif-count",
    pattern: "[VILMAFP](K).E",
    takeAverage: false,
  },
  MOD_SUMO_rev_2: {
    compute: "regex-motif-count",
    pattern: "[SDE].{0,5}[DE].(K).{0,1}[AIFLMPSTV]",
    takeAverage: false,
  },
  N_repeats: {
    compute: "repeat-span",
    resGroup: "N",
    takeAverage: false,
  },
  PG_rich: {
    compute: "regex-motif-span",
    pattern: "G..[GP][PG]",
    takeAverage: false,
  },
  PR_repeats: {
    compute: "repeat-span",
    resGroup: "PR",
    takeAverage: false,
  },
  PTS_repeats: {
    compute: "repeat-span",
    resGroup: "PTS",
    takeAverage: false,
  },
  PY: {
    compute: "regex-motif-span",
    pattern: "PY",
    takeAverage: false,
  },
  P_repeats: {
    compute: "repeat-span",
    resGroup: "P",
    takeAverage: false,
  },
  QN_repeats: {
    compute: "repeat-span",
    resGroup: "QN",
    takeAverage: false,
  },
  Q_repeats: {
    compute: "repeat-span",
    resGroup: "Q",
    takeAverage: false,
  },
  REP_RGG: {
    compute: "regex-motif-span",
    pattern: "RGG",
    takeAverage: false,
  },
  RG_repeats: {
    compute: "repeat-span",
    resGroup: "RG",
    takeAverage: false,
  },
  RK_ratio: {
    compute: "log-ratio",
    numerator: "R",
    denominator: "K",
  },
  R_plus_Y: {
    compute: "regex-motif-span",
    pattern: "[RY]",
    takeAverage: false,
  },
  R_repeats: {
    compute: "repeat-span",
    resGroup: "R",
    takeAverage: false,
  },
  SGFYSG: {
    compute: "regex-motif-span",
    pattern: "[SG][FY][SG]",
    takeAverage: false,
  },
  SG_repeats: {
    compute: "repeat-span",
    resGroup: "SG",
    takeAverage: false,
  },
  SR_repeats: {
    compute: "repeat-span",
    resGroup: "SR",
    takeAverage: false,
  },
  S_repeats: {
    compute: "repeat-span",
    resGroup: "S",
    takeAverage: false,
  },
  TRG_ER_FFAT_1: {
    compute: "regex-motif-count",
    pattern: "[EDS].{0,4}[ED][FY][FYKREM][DE][AC].{1,2}[EDST]",
    takeAverage: false,
  },
  TRG_ER_diArg_1: {
    compute: "regex-motif-count",
    pattern: "([LIVMFYWPR]R[^YFWDE]{0,1}R)|(R[^YFWDE]{0,1}R[LIVMFYWPR])",
    takeAverage: false,
  },
  TRG_LysEnd_APsAcLL_1: {
    compute: "regex-motif-count",
    pattern: "[DERQ]...L[LVI]",
    takeAverage: false,
  },
  TRG_NES_CRM1_1: {
    compute: "regex-motif-count",
    pattern:
      "([DEQ].{0,1}[LIM].{2,3}[LIVMF][^P]{2,3}[LMVF].[LMIV].{0,3}[DE])|([DE].{0,1}[LIM].{2,3}[LIVMF][^P]{2,3}[LMVF].[LMIV].{0,3}[DEQ])",
    takeAverage: false,
  },
  TRG_NLS_MonoExtN_4: {
    compute: "regex-motif-count",
    pattern:
      "(([PKR].{0,1}[^DE])|([PKR]))((K[RK])|(RK))(([^DE][KR])|([KR][^DE]))[^DE]",
    takeAverage: false,
  },
  acidic: {
    compute: "percent-res-group",
    resGroup: "DE",
  },
  aliphatic: {
    compute: "percent-res-group",
    resGroup: "ALMIV",
  },
  aromatic: {
    compute: "percent-res-group",
    resGroup: "FYW",
  },
  arospacing: {
    compute: "simple-spacing-omega",
    resGroup: "FYW",
    blobSize: 5,
  },
  basic: {
    compute: "percent-res-group",
    resGroup: "RK",
  },
  chain_expanding: {
    compute: "percent-res-group",
    resGroup: "DEKRP",
  },
  complexity: {
    compute: "sequence-complexity",
  },
  custom_kappa: {
    compute: "simple-spacing-delta",
    resGroupA: "DE",
    resGroupB: "KR",
    blobSize: 5,
  },
  custom_omega: {
    compute: "simple-spacing-omega",
    resGroup: "DEKRP",
    blobSize: 5,
  },
  disorder_promoting: {
    compute: "percent-res-group",
    resGroup: "TAGRDHQKSEP",
  },
  fcr: {
    compute: "percent-res-group",
    resGroup: "DEKR",
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
  polar_fraction: {
    compute: "percent-res-group",
    resGroup: "QNSTGCH",
  },
  scd: {
    compute: "scd",
  },
};
/** Number of features in `FEATURE_CONFIGURATION`. */
export const NUM_FEATURES = Object.keys(FEATURE_CONFIGURATION).length;
export const EXAMPLE_TEXT_INPUT =
  ">DDX3X_HUMAN|1-167\nMSHVAVENALGLDQQFAGLDLNSSDNQSGGSTASKGRYIPPHLRNREATKGFYDKDSSGWSSSKDKDAYSSFGSRSDSRGKSSFFSDRGSGSRGRFDDRGRSDYDGIGSRGDRSGFGKFERGGNSRWCDKSDEDDWSKPLPPSERLEQELFSGGNTGINFEKYDDIP";
