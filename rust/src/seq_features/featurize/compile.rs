use crate::{adapters::PseudoMap, seq_features::{
    functionality::compile::{CompilableSeqFeats, CompilerImplementor},
    implementors::{
        log_ratio::compile::LogRatioUserFacing,
        nardini_spacing::compile::{
            NardiniSpacingUserFacing, deserialize_nardini_delta, deserialize_nardini_omega,
        },
        percent_resgroup::compile::PercentResidueGroupUserFacing,
        percent_residue::compile::PercentResidueUserFacing,
        regex_motifs::compile::{
            RegexMotifUserFacing, deserialize_count_motif, deserialize_span_of_motif,
        },
        simple_score::compile::SimpleScoreUserFacing,
        simple_spacing::compile::{
            SimpleSpacingUserFacing, deserialize_simple_spacing_delta,
            deserialize_simple_spacing_omega,
        },
    },
}};
use serde::{Deserialize, Serialize};

/// A user-facing data struct to describe
/// a container of features.
///
/// For now (Jan 16th, 2026), it's a hashmap.
/// Maybe I'll add metadata to it some day.
#[derive(Deserialize, Serialize)]
pub struct FeatureContainerUserFacing<T> {
    #[serde(flatten)]
    features: PseudoMap<String, T>,
}
/// Compile from an iterator of named features.
///
/// This function returns:
/// 1. A featurizer.
/// 2. A vector of feature names, ordered in the same
///    order that the corresponding features will be computed.
/// 3. A vector of compilation errors, along with the
///    name of the feature which couldn't be compiled.
pub fn compile_features<'a, F: CompilableSeqFeats>(
    data: &'a FeatureContainerUserFacing<<F::Compiler<'a> as CompilerImplementor<'a>>::UserFacing>,
) -> FeaturizerCompilation<'a, F> {
    let mut compiler = F::Compiler::default();
    let mut compile_errors = Vec::new();
    let mut featdim = 0;
    for (feature_id, feature) in data.features.iter() {
        match compiler.compile(&feature, &*feature_id) {
            Ok(()) => {
                featdim += 1;
            }
            Err(err) => {
                compile_errors.push((&**feature_id, err));
            }
        }
    }
    let mut feat_order = Vec::with_capacity(featdim);
    let featurizer = compiler.finish(&mut feat_order);
    FeaturizerCompilation {
        featurizer,
        feat_order,
        compile_errors,
    }
}
/// The data returned by the [`compile_features`] function.
pub struct FeaturizerCompilation<'a, F: CompilableSeqFeats> {
    /// The featurizer that is compiled.
    pub featurizer: F,
    /// Feature names, ordered in the same order that
    /// the featurizer will compute them.
    pub feat_order: Vec<&'a str>,
    /// Compilation errors along with the names of features
    /// which couldn't be compiled.
    pub compile_errors: Vec<(&'a str, <F::Compiler<'a> as CompilerImplementor<'a>>::Err)>,
}
/// A master marshallable type that represents
/// any supported feature as of Jan 16th, 2026.
#[derive(Deserialize, Serialize)]
#[serde(tag = "compute", rename_all = "kebab-case")]
pub enum SeqFeatureUserFacing {
    IsoelectricPoint,
    #[serde(rename = "scd")]
    SCD,
    #[serde(rename = "shd")]
    SHD,
    LogRatio(LogRatioUserFacing),
    NardiniDelta(#[serde(deserialize_with = "deserialize_nardini_delta")] NardiniSpacingUserFacing),
    NardiniOmega(#[serde(deserialize_with = "deserialize_nardini_omega")] NardiniSpacingUserFacing),
    PercentResGroup(PercentResidueGroupUserFacing),
    PercentResidue(PercentResidueUserFacing),
    RegexMotifCount(#[serde(deserialize_with = "deserialize_count_motif")] RegexMotifUserFacing),
    RegexMotifSpan(#[serde(deserialize_with = "deserialize_span_of_motif")] RegexMotifUserFacing),
    SequenceComplexity,
    SimpleScore(SimpleScoreUserFacing),
    SimpleSpacingDelta(
        #[serde(deserialize_with = "deserialize_simple_spacing_delta")] SimpleSpacingUserFacing,
    ),
    SimpleSpacingOmega(
        #[serde(deserialize_with = "deserialize_simple_spacing_omega")] SimpleSpacingUserFacing,
    ),
}
