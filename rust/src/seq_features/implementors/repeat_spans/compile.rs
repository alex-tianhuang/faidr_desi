use crate::{
    datatypes::sequences::AACanonicalString,
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::repeat_spans::{RepeatSpan, RepeatSpans},
    },
};
use serde::{Deserialize, Serialize};
use std::convert::Infallible;

/// Marshallable type corresponding to [`super::RepeatSpan`].
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepeatSpanUserFacing {
    res_group: AACanonicalString,
    take_average: bool,
}
/// Compiler for repeat span features.
#[derive(Default)]
pub struct RepeatSpanCompiler<'a> {
    repeats: Vec<(&'a str, RepeatSpan)>,
}
impl<'a> CompilerImplementor<'a> for RepeatSpanCompiler<'a> {
    type Container = RepeatSpans;
    type Err = Infallible;
    type UserFacing = RepeatSpanUserFacing;
    /// Compile a single [`RepeatSpanUserFacing`]
    /// (see compiler template).
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let feature = RepeatSpan {
            res_group: data.res_group.into_iter().collect(),
            take_average: data.take_average,
        };
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
        return RepeatSpans { repeats };
    }
}
impl CompilableSeqFeats for RepeatSpans {
    type Compiler<'a> = RepeatSpanCompiler<'a>;
}
