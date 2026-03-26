use bumpalo::Bump;

use crate::{
    Graphic,
    datatypes::{AAMap, aa_canonical_str},
    seq_features::{
        contexts::common::{ArenaCtx, WindowTooLargeError, sliding_average},
        functionality::{featdim::FeatDim, render::RenderableSeqFeats},
    },
};
mod compile;
/// A renderable version of a single "simple-score" feature
/// (weighted count of each aminoacid type), and the window-size
/// to average out tracks using.
pub struct SimpleScoreRenderable {
    data: AAMap<f64>,
    window_size: u32,
}

/// A container of renderable features pertaining the weighted
/// count of different aminoacid types.
pub struct SimpleScoreRenderableContainer {
    data: Vec<SimpleScoreRenderable>,
}
impl RenderableSeqFeats for SimpleScoreRenderableContainer {
    type Ctx<'a> = ArenaCtx<'a>;
    type Err = WindowTooLargeError;
    /// Part of the [`RenderableSeqFeats`] template.
    ///
    /// Makes a line plot of the score per residue.
    fn render<'a>(
        &self,
        sequence: &aa_canonical_str,
        mut ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<Graphic, Self::Err>> {
        let SimpleScoreRenderableContainer { data } = self;
        data.iter()
            .map(move |renderable| render_simple_score(renderable, sequence, ctx.get_memory()))
    }
}
/// Helper for [`SimpleScoreRenderableContainer::render`].
///
/// Makes a line plot of the score per residue.
fn render_simple_score(
    renderable: &SimpleScoreRenderable,
    sequence: &aa_canonical_str,
    arena: &Bump,
) -> Result<Graphic, WindowTooLargeError> {
    let line_plot = sliding_average(
        sequence.into_iter().map(|aa| renderable.data[aa]),
        renderable.window_size,
        arena,
    )?;
    Ok(Graphic::LinePlot(line_plot))
}
impl FeatDim for SimpleScoreRenderableContainer {
    fn featdim(&self) -> usize {
        self.data.len()
    }
}
