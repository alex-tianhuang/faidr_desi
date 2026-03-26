use crate::{
    Graphic,
    datatypes::aa_canonical_str,
    seq_features::{
        contexts::{common::ArenaCtx, render::get_regex_segments},
        functionality::render::RenderableSeqFeats,
        implementors::regex_motifs::RegexMotifs,
    },
};
use bumpalo::Bump;
use regex::Regex;
use std::{
    convert::{Infallible, identity},
    iter::repeat_with,
};

impl RenderableSeqFeats for RegexMotifs {
    type Ctx<'a> = ArenaCtx<'a>;
    type Err = Infallible;
    /// Part of the [`RenderableSeqFeats`] template.
    ///
    /// Returns segments corresponding to matches to each regex.
    fn render<'a>(
        &self,
        sequence: &aa_canonical_str,
        mut ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<Graphic, Self::Err>> {
        let RegexMotifs {
            counts,
            count_averages,
            spans,
            span_averages,
        } = self;
        let mut counts = counts.iter();
        let mut count_averages = count_averages.iter();
        let mut spans = spans.iter();
        let mut span_averages = span_averages.iter();
        repeat_with(move || {
            counts
                .next()
                .map(|pattern| render_regex_matches(pattern, sequence, ctx.get_memory()))
                .or_else(|| {
                    count_averages
                        .next()
                        .map(|pattern| render_regex_matches(pattern, sequence, ctx.get_memory()))
                })
                .or_else(|| {
                    spans
                        .next()
                        .map(|pattern| render_regex_matches(pattern, sequence, ctx.get_memory()))
                })
                .or_else(|| {
                    span_averages
                        .next()
                        .map(|pattern| render_regex_matches(pattern, sequence, ctx.get_memory()))
                })
                .map(Result::Ok)
        })
        .map_while(identity)
    }
}

/// Render segments of the sequence matching the
/// given regex.
fn render_regex_matches(pattern: &Regex, sequence: &aa_canonical_str, arena: &Bump) -> Graphic {
    get_regex_segments(arena, sequence, pattern)
        .map(|mut seg| {
            seg.label = sequence[seg.start as usize..seg.stop as usize]
                .as_str()
                .to_string();
            seg
        })
        .collect()
}
