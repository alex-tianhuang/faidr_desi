use crate::{Graphic, datatypes::{AAMap, aa_canonical_str, render::LinePlot}, seq_features::{
    contexts::common::{WindowTooLargeError}, functionality::{featdim::FeatDim, render::RenderableSeqFeats},
}};
mod compile;

/// A single feature for rendering a sliding window
/// of local sequence complexity.
pub struct SequenceComplexityRenderable {
    window_size: Option<u32>,
}
impl RenderableSeqFeats for SequenceComplexityRenderable {
    type Ctx<'a> = ();
    type Err = WindowTooLargeError;
    /// Part of the [`RenderableSeqFeats`] template.
    /// 
    /// Renders a single feature, local sequence complexity.
    fn render<'a>(
        &self,
        sequence: &aa_canonical_str,
        _ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<Graphic, Self::Err>> {
        self.window_size
            .map(move |window_size| render_local_sequence_complexity(sequence, window_size))
            .into_iter()
    }
}
/// Helper for [`SequenceComplexityRenderable::render`].
/// 
/// Renders local sequence complexity using a sliding
/// window of size `window_size`.
fn render_local_sequence_complexity(sequence: &aa_canonical_str, window_size: u32)
-> Result<Graphic, WindowTooLargeError> {
    let window_size = window_size as usize;
    if sequence.len() < window_size {
        return Err(WindowTooLargeError)
    };
    let (ln_sum_gamma, _) = special::Gamma::ln_gamma((1 + window_size) as f64);
    let mut counter: AAMap<usize> = AAMap::default();
    let mut ln_gamma_cache: AAMap<f64> = AAMap::default();
    for &aa in &sequence.as_slice()[..window_size] {
        counter[aa] += 1;
    }
    let mut sum_ln_gamma = 0.0;
    for (aa, &count) in counter.iter() {
        if count > 0 {
            let (ln_gamma, _) = special::Gamma::ln_gamma((1 + count) as f64);
            ln_gamma_cache[aa] = ln_gamma;
            sum_ln_gamma += ln_gamma;
        };
    }
    let local_complexity = (ln_sum_gamma - sum_ln_gamma) / window_size as f64;
    let mut data = Vec::with_capacity(sequence.len() - window_size + 1);
    data.push(local_complexity);
    for window_start in 0..(sequence.len() - window_size) {
        let prev_aa = sequence[window_start];
        let next_aa = sequence[window_start + window_size];
        if prev_aa != next_aa {
            let aa = prev_aa;
            counter[aa] -= 1;
            let count = counter[aa];
            let (ln_gamma, _) = special::Gamma::ln_gamma((1 + count) as f64);
            let old_ln_gamma = ln_gamma_cache[aa];
            ln_gamma_cache[aa] = ln_gamma;
            sum_ln_gamma += ln_gamma - old_ln_gamma;
            let aa = next_aa;
            counter[aa] += 1;
            let count = counter[aa];
            let (ln_gamma, _) = special::Gamma::ln_gamma((1 + count) as f64);
            let old_ln_gamma = ln_gamma_cache[aa];
            ln_gamma_cache[aa] = ln_gamma;
            sum_ln_gamma += ln_gamma - old_ln_gamma;
        };
        let local_complexity = (ln_sum_gamma - sum_ln_gamma) / window_size as f64;
        data.push(local_complexity);
    }
    let start = (window_size + 1) as f64 / 2.0;
    Ok(Graphic::LinePlot(LinePlot { data, start }))
}
impl FeatDim for SequenceComplexityRenderable {
    fn featdim(&self) -> usize {
        self.window_size.is_some() as usize
    }
}