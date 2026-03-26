use crate::{
    Graphic,
    datatypes::{AASet, aa_canonical_str, render::Segment},
    seq_features::{
        contexts::render::composite::Ctx1,
        functionality::render::RenderableSeqFeats,
        implementors::simple_spacing::{
            SimpleSpacingContainer, SimpleSpacingDelta, SimpleSpacingError, SimpleSpacingOmega,
        },
    },
};
use bumpalo::{Bump, collections::Vec};
use std::{convert::identity, iter::repeat_with};

impl RenderableSeqFeats for SimpleSpacingContainer {
    type Ctx<'a> = Ctx1<'a>;
    type Err = SimpleSpacingError;
    /// Part of the [`RenderableSeqFeats`] template.
    ///
    /// Renders simple-spacing features by showing where the
    /// "blobs" are. Blobs of residue group X, as described in
    /// [`super`] module level docs, are regions containing two
    /// or more residues in residue group X that are separated
    /// by fewer than `blob_size` residues.
    ///
    /// See [`render_simple_spacing_delta`] and [`render_simple_spacing_omega`].
    fn render<'a>(
        &self,
        sequence: &aa_canonical_str,
        mut ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<Graphic, Self::Err>> {
        let SimpleSpacingContainer { deltas, omegas } = self;
        let mut deltas = deltas.iter();
        let mut omegas = omegas.iter();
        repeat_with(move || {
            deltas
                .next()
                .map(|feature| render_simple_spacing_delta(feature, sequence, &mut ctx))
                .or_else(|| {
                    omegas
                        .next()
                        .map(|feature| render_simple_spacing_omega(feature, sequence, &mut ctx))
                })
        })
        .map_while(identity)
    }
}

/// Helper function for [`SimpleSpacingContainer::render`].
///
/// Generates segments corresponding to blobs of two opposing
/// residue groups. The blobs of residue group A are not allowed
/// to contain residues from residue group B, and vice versa.
fn render_simple_spacing_delta(
    feature: &SimpleSpacingDelta,
    sequence: &aa_canonical_str,
    ctx: &mut Ctx1<'_>,
) -> Result<Graphic, SimpleSpacingError> {
    let SimpleSpacingDelta {
        res_group_a,
        res_group_b,
        ..
    } = feature;
    let count_a = ctx.residue_counts.count_residue_group(res_group_a);
    if count_a == sequence.len() {
        return Err(SimpleSpacingError::Saturated {
            res_group: res_group_a.clone(),
        });
    }
    let count_b = ctx.residue_counts.count_residue_group(res_group_b);
    if count_b == sequence.len() {
        return Err(SimpleSpacingError::Saturated {
            res_group: res_group_b.clone(),
        });
    }
    if count_a + count_b == 0 {
        return Err(SimpleSpacingError::Depleted {
            res_group: res_group_a.union(res_group_b),
        });
    }
    Ok(generate_delta_segments(feature, sequence, ctx.arena.get_memory()).collect())
}
/// Helper function for [`render_simple_spacing_delta`].
///
/// Search for blobs of residue groups A and B that
/// do not contain residues from the other residue group.
fn generate_delta_segments<'a, 'b>(
    feature: &'a SimpleSpacingDelta,
    sequence: &'a aa_canonical_str,
    arena: &'b Bump,
) -> impl 'b + Iterator<Item = Segment> {
    let SimpleSpacingDelta {
        ref res_group_a,
        ref res_group_b,
        blob_size,
    } = *feature;
    let mut sites = sequence
        .into_iter()
        .enumerate()
        .filter(|(_, aa)| res_group_a.contains(*aa) || res_group_b.contains(*aa))
        .map(|(idx, aa)| (idx, res_group_a.contains(aa)));
    let (mut prev_site, mut prev_grp_a) = sites.next().expect("checked sequence is not depleted");
    let mut segment_start = None;
    let mut buf = Vec::with_capacity_in(sequence.len(), arena);
    for (site, grp_a) in sites {
        if site - prev_site < blob_size as usize && prev_grp_a == grp_a {
            if segment_start.is_none() {
                segment_start = Some(prev_site);
            }
        } else {
            if let Some(segment_start) = segment_start.take() {
                let res_group = if prev_grp_a { res_group_a } else { res_group_b };
                buf.push(generate_simple_spacing_segment(
                    sequence,
                    segment_start,
                    prev_site,
                    res_group,
                ));
            }
        }
        prev_site = site;
        prev_grp_a = prev_grp_a;
    }
    if let Some(segment_start) = segment_start.take() {
        let res_group = if prev_grp_a { res_group_a } else { res_group_b };
        buf.push(generate_simple_spacing_segment(
            sequence,
            segment_start,
            prev_site,
            res_group,
        ));
    }
    buf.into_iter()
}
/// Helper function for [`SimpleSpacingContainer::render`].
///
/// Generates segments corresponding to blobs of a single
/// residue group, described in the docs of the above function.
fn render_simple_spacing_omega(
    feature: &SimpleSpacingOmega,
    sequence: &aa_canonical_str,
    ctx: &mut Ctx1<'_>,
) -> Result<Graphic, SimpleSpacingError> {
    let SimpleSpacingOmega { res_group, .. } = feature;
    let count = ctx.residue_counts.count_residue_group(res_group);
    if count == sequence.len() {
        return Err(SimpleSpacingError::Saturated {
            res_group: res_group.clone(),
        });
    }
    if count == 0 {
        return Err(SimpleSpacingError::Depleted {
            res_group: res_group.clone(),
        });
    }
    Ok(generate_omega_segments(feature, sequence, ctx.arena.get_memory()).collect())
}
/// Helper function for [`render_simple_spacing_omega`].
///
/// Search for blobs of the given residue group.
fn generate_omega_segments<'a, 'b>(
    feature: &'a SimpleSpacingOmega,
    sequence: &'a aa_canonical_str,
    arena: &'b Bump,
) -> impl 'b + Iterator<Item = Segment> {
    let SimpleSpacingOmega {
        ref res_group,
        blob_size,
    } = *feature;
    let mut sites = sequence
        .into_iter()
        .enumerate()
        .filter(|(_, aa)| res_group.contains(*aa))
        .map(|(idx, _)| idx);
    let mut prev_site = sites.next().expect("checked sequence is not depleted");
    let mut segment_start = None;
    let mut buf = Vec::with_capacity_in(sequence.len(), arena);
    for site in sites {
        if site - prev_site < blob_size as usize {
            if segment_start.is_none() {
                segment_start = Some(prev_site);
            }
        } else {
            if let Some(segment_start) = segment_start.take() {
                buf.push(generate_simple_spacing_segment(
                    sequence,
                    segment_start,
                    prev_site,
                    res_group,
                ))
            }
        }
        prev_site = site;
    }
    if let Some(segment_start) = segment_start.take() {
        buf.push(generate_simple_spacing_segment(
            sequence,
            segment_start,
            prev_site,
            res_group,
        ))
    }
    buf.into_iter()
}
/// Helper function for [`render_simple_spacing_delta`]
/// and [`render_simple_spacing_omega`].
///
/// Given the boundaries of a segment, they are labelled
/// using the residue types present in them.
fn generate_simple_spacing_segment(
    sequence: &aa_canonical_str,
    start: usize,
    stop_inclusive: usize,
    res_group: &AASet,
) -> Segment {
    let stop = stop_inclusive + 1;
    let label_set = AASet::from_iter(
        (&sequence[start..stop])
            .into_iter()
            .filter(|aa| res_group.contains(*aa)),
    );
    Segment {
        label: label_set.to_string(),
        start: start as u32,
        stop: stop as u32,
    }
}
