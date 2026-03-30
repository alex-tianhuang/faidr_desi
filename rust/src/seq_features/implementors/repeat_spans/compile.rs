use serde::{Deserialize, Serialize};

use crate::{datatypes::sequences::AACanonicalStringStrict, seq_features::{functionality::compile::{CompilableSeqFeats, CompilerImplementor}, implementors::{DuplicateFeatureError, repeat_spans::{RepeatSpan, RepeatSpans}}}};

/// Marshallable type corresponding to [`super::RepeatSpan`].
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepeatSpanUserFacing {
    residues: AACanonicalStringStrict,
    take_average: bool
}
/// Compiler for repeat span features.
#[derive(Default)]
pub struct RepeatSpanCompiler<'a> {
    repeats: Vec<(&'a str, RepeatSpan)>
}
impl<'a> CompilerImplementor<'a> for RepeatSpanCompiler<'a> {
    type Container = RepeatSpans;
    type Err = DuplicateFeatureError;
    type UserFacing = RepeatSpanUserFacing;
    /// Compile a single [`RepeatSpanUserFacing`]
    /// (see compiler template).
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let feature = RepeatSpan {
            residues: data.residues.into_iter().collect(),
            take_average: data.take_average
        };
        if self.repeats
            .iter()
            .find(|(_, other_feature)| other_feature == &feature)
            .is_some()
        {
            return Err(DuplicateFeatureError);
        }
        self.repeats.push((feature_id, feature));
        Ok(())
    }
    /// Make a [`RepeatSpans`] and extend the given feature IDs
    /// with these feature IDs.
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        let mut repeats = Vec::with_capacity(self.repeats.len());
        for (feature_id, feature) in self.repeats {
            feature_ids.push(feature_id);
            repeats.push(feature);
        }
        return RepeatSpans {
            repeats
        }
    }
}
impl CompilableSeqFeats for RepeatSpans {
    type Compiler<'a> = RepeatSpanCompiler<'a>;
}