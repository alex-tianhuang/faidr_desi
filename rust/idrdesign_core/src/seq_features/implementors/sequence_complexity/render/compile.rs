use serde::Deserialize;

use crate::seq_features::{
    functionality::compile::{CompilableSeqFeats, CompilerImplementor},
    implementors::{
        DuplicateFeatureError, sequence_complexity::render::SequenceComplexityRenderable,
    },
};
/// A single feature corresponding to local sequence complexity,
/// with window size as the only parameter.
#[derive(Deserialize)]
pub struct SequenceComplexityRenderableUserFacing {
    window_size: u32,
}
/// A single feature compiler for sequence complexity (renderable).
#[derive(Default)]
pub struct SequenceComplexityRenderableCompiler<'a> {
    data: Option<(&'a str, u32)>,
}
impl<'a> CompilerImplementor<'a> for SequenceComplexityRenderableCompiler<'a> {
    type Container = SequenceComplexityRenderable;
    type Err = DuplicateFeatureError;
    type UserFacing = SequenceComplexityRenderableUserFacing;
    /// Part of the [`CompilableSeqFeats`] template.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        if self.data.is_some() {
            Err(DuplicateFeatureError)
        } else {
            self.data = Some((feature_id, data.window_size));
            Ok(())
        }
    }
    /// Part of the [`CompilableSeqFeats`] template.
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        let window_size = self.data.map(|(feature_id, window_size)| {
            feature_ids.push(feature_id);
            window_size
        });
        SequenceComplexityRenderable { window_size }
    }
}
impl CompilableSeqFeats for SequenceComplexityRenderable {
    type Compiler<'a> = SequenceComplexityRenderableCompiler<'a>;
}