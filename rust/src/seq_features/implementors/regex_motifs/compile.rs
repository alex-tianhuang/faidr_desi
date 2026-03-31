use regex::Regex;
use serde::{Deserialize, Deserializer, Serialize};
use thiserror::Error;

use crate::seq_features::{
    functionality::compile::{CompilableSeqFeats, CompilerImplementor},
    implementors::{DuplicateFeatureError, regex_motifs::RegexMotifs},
};

/// A single regex-based motif feature.
///
/// Marshallable via [`deserialize_count_motif`]
/// and [`deserialize_span_of_motif`].
///
/// This type is not directly deserializable because
/// I intend for the count/span to be specified in the
/// `compute` field, which doesn't fit the pattern of
/// the other features.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegexMotifUserFacing {
    pattern: String,
    take_average: bool,
    #[serde(skip_serializing)]
    mode: RegexMotifMode,
}
/// Whether the feature is computing the count or span
/// of a motif.
#[derive(Serialize)]
pub enum RegexMotifMode {
    Count,
    Span,
}
/// The publically visible fields of [`RegexMotifUserFacing`].
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct RegexMotifPublic {
    pattern: String,
    take_average: bool,
}
/// Specify that a [`RegexMotifPublic`] schema be
/// deserialized as a count motif feature.
pub fn deserialize_count_motif<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<RegexMotifUserFacing, D::Error> {
    let RegexMotifPublic {
        pattern,
        take_average,
    } = RegexMotifPublic::deserialize(deserializer)?;
    Ok(RegexMotifUserFacing {
        pattern,
        take_average,
        mode: RegexMotifMode::Count,
    })
}
/// Specify that a [`RegexMotifPublic`] schema be
/// deserialized as a span of motif feature.
pub fn deserialize_span_of_motif<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<RegexMotifUserFacing, D::Error> {
    let RegexMotifPublic {
        pattern,
        take_average,
    } = RegexMotifPublic::deserialize(deserializer)?;
    Ok(RegexMotifUserFacing {
        pattern,
        take_average,
        mode: RegexMotifMode::Span,
    })
}
/// A compiler for regex motif features.
#[derive(Default)]
pub struct RegexMotifsCompiler<'a> {
    counts: Vec<(&'a str, Regex)>,
    count_averages: Vec<(&'a str, Regex)>,
    spans: Vec<(&'a str, Regex)>,
    span_averages: Vec<(&'a str, Regex)>,
}
impl<'a> CompilerImplementor<'a> for RegexMotifsCompiler<'a> {
    type UserFacing = RegexMotifUserFacing;
    type Container = RegexMotifs;
    type Err = CompileRegexMotifError;
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Acts like an accumulator for [`RegexMotifUserFacing`]
    /// associated with a feature ID.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let pattern = Regex::new(&data.pattern).map_err(CompileRegexMotifError::RegexErr)?;
        let dest = match (&data.mode, data.take_average) {
            (RegexMotifMode::Count, false) => &mut self.counts,
            (RegexMotifMode::Count, true) => &mut self.count_averages,
            (RegexMotifMode::Span, false) => &mut self.spans,
            (RegexMotifMode::Span, true) => &mut self.span_averages,
        };
        if dest
            .iter()
            .find(|(_, other_pattern)| other_pattern.as_str() == &data.pattern)
            .is_some()
        {
            return Err(CompileRegexMotifError::DuplicateFeatureError(
                DuplicateFeatureError,
            ));
        }
        dest.push((feature_id, pattern));
        Ok(())
    }
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Returns feature IDs of different operations in the order that
    /// those operations are defined on the [`RegexMotifs`] struct.
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        /// Write the implementation of finish with as little boilerplate as possible.
        macro_rules! impl_finish {
            ($($field:ident),+) => {
                $(let $field = self.$field.into_iter().map(|(feature_id, pattern)| {
                    feature_ids.push(feature_id);
                    pattern
                }).collect();)+
                RegexMotifs {
                    $($field),+
                }
            };
        }
        impl_finish! {
            counts,
            count_averages,
            spans,
            span_averages
        }
    }
}
impl CompilableSeqFeats for RegexMotifs {
    type Compiler<'a> = RegexMotifsCompiler<'a>;
}
/// Errors that can arise when compiling a regex-motif
/// feature.
#[derive(Debug, Error)]
pub enum CompileRegexMotifError {
    #[error("{0}")]
    RegexErr(regex::Error),
    #[error("{0}")]
    DuplicateFeatureError(DuplicateFeatureError),
}
