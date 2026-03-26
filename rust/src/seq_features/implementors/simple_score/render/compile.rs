use serde::Deserialize;

use crate::{
    JSFacingAAMap,
    datatypes::AAMap,
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::{
            DuplicateFeatureError,
            simple_score::render::{SimpleScoreRenderable, SimpleScoreRenderableContainer},
        },
    },
};
/// Render a single simple-score feature
/// as a sliding average of residue scores.
#[derive(Deserialize, Clone)]
pub struct SimpleScoreRenderableUserFacing {
    weights: JSFacingAAMap<f32>,
    window_size: u32,
}
#[derive(Default)]
pub struct SimpleScoreRenderableCompiler<'a> {
    data: Vec<(&'a str, SimpleScoreRenderable)>,
}
impl<'a> CompilerImplementor<'a> for SimpleScoreRenderableCompiler<'a> {
    type Container = SimpleScoreRenderableContainer;
    type Err = DuplicateFeatureError;
    type UserFacing = SimpleScoreRenderableUserFacing;
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Adds one simple-score to be rendered, checking for uniqueness.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        if self
            .data
            .iter()
            .any(|(_, renderable)| renderable.data.eq(&data.weights))
        {
            Err(DuplicateFeatureError)
        } else {
            self.data.push((
                feature_id,
                SimpleScoreRenderable {
                    data: AAMap::clone(&data.weights),
                    window_size: data.window_size,
                },
            ));
            Ok(())
        }
    }
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Returns a container capable of rendering "simple-score"
    /// features (sliding averages of residue scores).
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        let data = self
            .data
            .into_iter()
            .map(|(feature_id, renderable)| {
                feature_ids.push(feature_id);
                renderable
            })
            .collect::<Vec<SimpleScoreRenderable>>();
        SimpleScoreRenderableContainer { data }
    }
}
impl CompilableSeqFeats for SimpleScoreRenderableContainer {
    type Compiler<'a> = SimpleScoreRenderableCompiler<'a>;
}
