use bumpalo::Bump;

use crate::{
    Graphic,
    datatypes::{Aminoacid, aa_canonical_str},
    seq_features::{
        contexts::{common::ArenaCtx, render::get_simple_segments},
        functionality::render::RenderableSeqFeats,
        implementors::percent_residue::PercentResidue,
    },
};
use std::convert::Infallible;

impl RenderableSeqFeats for PercentResidue {
    type Ctx<'a> = ArenaCtx<'a>;
    type Err = Infallible;
    /// Part of the [`RenderableSeqFeats`] template.
    ///
    /// Returns contiguous segments of each aminoacid type
    /// to be rendered.
    fn render<'a>(
        &self,
        sequence: &aa_canonical_str,
        mut ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<Graphic, Self::Err>> {
        self.residues
            .iter()
            .map(move |aa| Ok(render_percent_residue(sequence, aa, ctx.get_memory())))
    }
}

/// Return contiguous segments of aminoacid `aa`.
fn render_percent_residue(sequence: &aa_canonical_str, aa: Aminoacid, arena: &Bump) -> Graphic {
    Graphic::from_iter(
        get_simple_segments(arena, sequence, |res| res == aa).map(|mut seg| {
            seg.label = aa.to_string();
            seg
        }),
    )
}
