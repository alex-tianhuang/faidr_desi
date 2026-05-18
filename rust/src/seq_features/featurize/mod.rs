//! A module defining a master featurizer and its compiler.
//!
//! Dev notes
//! ---------
//! The master featurizer is built out of "subfeaturizers".
//! These subfeaturizers are the [sequence feature implementors],
//! which represent a subclass of sequence features, such as
//! motifs, simple-spacing, etc.
//!
//! The point of splitting this up the code this way is so that
//! each subfeaturizer is a manageable amount of work to
//! implement/update. The goal is development time for new
//! sequence features, as I anticipate adding many new ones.
//!
//! The point of this submodule then is to tie the subfeaturizers
//! together into one master struct. Currently, I inline each
//! subclass of feature because the context required to compute
//! each feature efficiently does not really support virtualization.
//!
//! The implementation of the master featurizer is described mostly
//! in these [macro docs].
//!
//! [sequence feature implementors]: crate::seq_features::implementors
//! [macro docs]: r#macro::define_compiler_and_featurizer
use crate::{
    datatypes::{StandardError, aa_canonical_str, into_standard_error},
    seq_features::{
        functionality::featdim::FeatDim,
        implementors::{
            isoelectric_point::IsoelectricPoint, log_ratio::LogRatioContainer,
            percent_resgroup::PercentResidueGroup,
            percent_residue::PercentResidue, regex_motifs::RegexMotifs, repeat_spans::RepeatSpans,
            sequence_charge_decoration::SCD, sequence_complexity::SequenceComplexity,
            sequence_hydropathy_decoration::SHD, simple_score::SimpleScore,
            simple_spacing::SimpleSpacingContainer,
        },
    },
};
pub use compile::{FeaturizerCompilation, SeqFeatureUserFacing, compile_features};
use context_provider::FeaturizerContextProvider;
mod compile;
mod context_provider;
mod r#macro;
/// A marshallable type specifying a collection of features.
///
/// Uses [`FeatureContainerUserFacing`] and
/// [`SeqFeatureUserFacing`] currently.
pub type FeatureContainerUserFacing = compile::FeatureContainerUserFacing<SeqFeatureUserFacing>;

r#macro::define_compiler_and_featurizer! {
    /// A sequence feature computing struct that
    /// supports all features defined by [`SeqFeatureUserFacing`].
    ///
    /// As of Feb 15th, 2026, this includes:
    /// - Isoelectric point
    /// - Sequence charge decoration
    /// - Sequence hydropathy decoration
    /// - Log ratio (soft log)
    /// - Nardini spacing (delta/omega)
    /// - Percent residue group
    /// - Percent residue
    /// - Regex-based motifs (spans/counts)
    /// - Sequence complexity
    /// - Simple score (linear sum over composition)
    /// - Simple spacing (delta/omega-like)
    pub struct Featurizer {
        /// Compute all the sequence features specified by this
        /// container.
        ///
        /// The iterator yields numbers or errors in the order
        /// that the features are arranged, yielding a total
        /// of [`Featurizer::featdim`] feature values/errors.
        fn featurize(sequence: &aa_canonical_str) -> Iterator<.., StandardError> {
            let mut provider: FeaturizerContextProvider;
            provider.compute(sequence);
            #[ftz(context = provider.residue_counts())]
            #[ftz(map_err = into_standard_error)]
            let isoelectric_point: IsoelectricPoint;
            #[ftz(context = provider.ctx2())]
            #[ftz(map_err = into_standard_error)]
            let scd: SCD;
            #[ftz(context = provider.arena())]
            #[ftz(map_err = into_standard_error)]
            let shd: SHD;
            #[ftz(context = provider.residue_counts())]
            #[ftz(map_err = into_standard_error)]
            let log_ratio: LogRatioContainer;
            #[ftz(context = provider.residue_counts())]
            #[ftz(map_err = into_standard_error)]
            let percent_res_group: PercentResidueGroup;
            #[ftz(context = provider.residue_counts())]
            #[ftz(map_err = into_standard_error)]
            let percent_residue: PercentResidue;
            #[ftz(context = ())]
            #[ftz(map_err = into_standard_error)]
            let repeat_spans: RepeatSpans;
            #[ftz(context = ())]
            #[ftz(map_err = into_standard_error)]
            let regex_motifs: RegexMotifs;
            #[ftz(context = provider.residue_counts())]
            #[ftz(map_err = into_standard_error)]
            let sequence_complexity: SequenceComplexity;
            #[ftz(context = provider.residue_counts())]
            #[ftz(map_err = into_standard_error)]
            let simple_score: SimpleScore;
            #[ftz(context = ())]
            #[ftz(map_err = into_standard_error)]
            let simple_spacing: SimpleSpacingContainer;
        }
    }
    /// A compiler type for the [`Featurizer`].
    ///
    /// Use [`FeaturizerCompiler::compile`] to compile
    /// as many features as you want, then use [`Featurizer::finish`]
    /// to return a finished [`Featurizer`].
    #[derive(Default)]
    pub struct FeaturizerCompiler {
        /// Compiles a [`SeqFeatureUserFacing`] into the master container
        /// or returns a [`StandardError`].
        fn compile(data: &SeqFeatureUserFacing, feature_id: &str) -> Result<(), StandardError> {
            /// Macro for writing `.map_err(|err| /* ... */)` over and over again.
            macro_rules! tri {
                ($x:expr) => {
                    $x.map_err(into_standard_error)
                };
            }
            match data {
                SeqFeatureUserFacing::IsoelectricPoint => tri!(isoelectric_point.compile(&(), feature_id)),
                SeqFeatureUserFacing::SCD => tri!(scd.compile(&(), feature_id)),
                SeqFeatureUserFacing::SHD => tri!(shd.compile(&(), feature_id)),
                SeqFeatureUserFacing::LogRatio(data) => tri!(log_ratio.compile(data, feature_id)),
                SeqFeatureUserFacing::PercentResGroup(data) => {
                    tri!(percent_res_group.compile(data, feature_id))
                }
                SeqFeatureUserFacing::PercentResidue(data) => tri!(percent_residue.compile(data, feature_id)),
                SeqFeatureUserFacing::RepeatSpan(data) => tri!(repeat_spans.compile(data, feature_id)),
                SeqFeatureUserFacing::RegexMotifCount(data)
                | SeqFeatureUserFacing::RegexMotifSpan(data) => tri!(regex_motifs.compile(data, feature_id)),
                SeqFeatureUserFacing::SequenceComplexity => {
                    tri!(sequence_complexity.compile(&(), feature_id))
                }
                SeqFeatureUserFacing::SimpleScore(data) => tri!(simple_score.compile(data, feature_id)),
                SeqFeatureUserFacing::SimpleSpacingDelta(data)
                | SeqFeatureUserFacing::SimpleSpacingOmega(data) => {
                    tri!(simple_spacing.compile(data, feature_id))
                }
            }
        }
        fn context_provider() {
            let needs_residue_counts = isoelectric_point.has_features()
                || scd.has_features()
                || log_ratio.has_features()
                || percent_res_group.has_features()
                || percent_residue.has_features()
                || sequence_complexity.has_features()
                || simple_score.has_features();
            let needs_arena = scd.has_features()
                || shd.has_features();
            FeaturizerContextProvider::new(
                needs_residue_counts, needs_arena
            )
        }
    }
}
