use crate::datatypes::render::LinePlot;
use bumpalo::Bump;
use thiserror::Error;
/// Resuable memory.
/// 
/// I use this instead of a raw [`Bump`] to make sure
/// I reset the arena regularly.
pub struct ArenaCtx<'a>(&'a mut Bump);
impl<'a> ArenaCtx<'a> {
    /// Public constructor.
    pub fn new(arena: &'a mut Bump) -> Self {
        Self(arena)
    }
    /// Reset and return the underlying memory arena.
    pub fn get_memory(&mut self) -> &Bump {
        self.0.reset();
        &*self.0
    }
}
#[derive(Debug, Error)]
#[error("sequence was smaller than window size")]
pub struct WindowTooLargeError;
/// Take a sliding average over if the sequence is at least
/// the sliding window length.
pub fn sliding_average(
    mut iter: impl ExactSizeIterator<Item = f32>,
    window_size: u32,
    arena: &Bump,
) -> Result<LinePlot, WindowTooLargeError> {
    let n = iter.len();
    let n_adjusted = n
        .checked_sub(window_size as usize)
        .ok_or(WindowTooLargeError)?
        + 1;
    let buf = arena.alloc_slice_fill_iter((&mut iter).take(window_size as usize));
    let mut window_sum = buf.iter().sum::<f32>();
    let mut data = Vec::with_capacity(n_adjusted);
    data.push(window_sum / window_size as f32);
    let mut cursor = 0;
    for value in iter {
        window_sum -= buf[cursor];
        buf[cursor] = value;
        window_sum += value;
        data.push(window_sum / window_size as f32);
        cursor = (cursor + 1) % window_size as usize;
    }
    let start = (window_size + 1) as f32 / 2.0;
    Ok(LinePlot { data, start })
}
