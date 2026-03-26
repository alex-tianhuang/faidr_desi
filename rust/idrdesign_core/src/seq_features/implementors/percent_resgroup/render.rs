use bumpalo::Bump;

use crate::{
    Graphic,
    datatypes::{AASet, aa_canonical_str},
    seq_features::{
        contexts::{common::ArenaCtx, render::get_simple_segments},
        functionality::render::RenderableSeqFeats,
        implementors::percent_resgroup::PercentResidueGroup,
    },
};
use std::convert::Infallible;

impl RenderableSeqFeats for PercentResidueGroup {
    type Ctx<'a> = ArenaCtx<'a>;
    type Err = Infallible;
    /// Part of the [`RenderableSeqFeats`] template.
    ///
    /// Returns contiguous segments of each residue group.
    fn render<'a>(
        &self,
        sequence: &aa_canonical_str,
        mut ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<Graphic, Self::Err>> {
        self.residue_groups.iter().map(move |res_group| {
            Ok(render_percent_residue_group(
                sequence,
                res_group,
                ctx.get_memory(),
            ))
        })
    }
}

/// Return contiguous segments of aminoacids in some `res_group`.
///
/// The label of each segment is all the residues from the `res_group`
/// that are in the segment.
fn render_percent_residue_group(sequence: &aa_canonical_str, res_group: &AASet, arena: &Bump) -> Graphic {
    Graphic::from_iter(
        get_simple_segments(arena, sequence, |res| res_group.contains(res)).map(|mut seg| {
            let subsequence = &sequence[seg.start as usize..seg.stop as usize];
            seg.label = AASet::from_iter(subsequence).to_string();
            seg
        }),
    )
}
