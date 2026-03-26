use std::convert::Infallible;

use bumpalo::Bump;

use crate::{
    Graphic,
    datatypes::{aa_canonical_str, render::Segments},
    seq_features::{
        contexts::{common::ArenaCtx, render::get_simple_segments},
        functionality::render::RenderableSeqFeats,
        implementors::log_ratio::{LogRatio, LogRatioContainer},
    },
};

impl RenderableSeqFeats for LogRatioContainer {
    type Ctx<'a> = ArenaCtx<'a>;
    type Err = Infallible;
    /// Part of the [`RenderableSeqFeats`] template.
    ///
    /// See [`render_log_ratio`].
    fn render<'a>(
        &self,
        sequence: &aa_canonical_str,
        mut ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<Graphic, Self::Err>> {
        self.data
            .iter()
            .map(move |renderable| Ok(render_log_ratio(renderable, sequence, ctx.get_memory())))
    }
}
/// Render segments corresponding to the denominator and numerator.
fn render_log_ratio(renderable: &LogRatio, sequence: &aa_canonical_str, arena: &Bump) -> Graphic {
    let LogRatio {
        numerator,
        denominator,
    } = *renderable;
    let mut data = Vec::new();
    data.extend(
        get_simple_segments(arena, sequence, |aa| aa == numerator).map(|mut segment| {
            segment.label = numerator.to_string();
            segment
        }),
    );
    data.extend(
        get_simple_segments(arena, sequence, |aa| aa == denominator).map(|mut segment| {
            segment.label = denominator.to_string();
            segment
        }),
    );
    Graphic::Segments(Segments { data })
}
