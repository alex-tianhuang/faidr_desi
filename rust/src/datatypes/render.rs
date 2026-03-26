//! Datatypes representing segments or numeric tracks,
//! used for rendering sequence features.
//! 
//! The [`Graphic`] struct is used as the intermediate
//! representation between this library and the rendering
//! engine (as of Nov 20th, 2025, that is `plotly`).
use serde::{Deserialize, Serialize};
use tsify::Tsify;

/// A datatype representing a generic visualization of one
/// sequence feature for one sequence.
/// 
/// There is no style or color information, as that is
/// expected to be computed by the rendering engine or its
/// associated adapters.
#[derive(Tsify, Deserialize, Serialize)]
#[tsify(into_wasm_abi)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum Graphic {
    Segments(Segments),
    LinePlot(LinePlot)
}

/// A bunch of [`Segment`]s.
#[derive(Tsify, Deserialize, Serialize)]
pub struct Segments {
    pub data: Vec<Segment>
}

/// A single contiguous region of a sequence.
/// 
/// (0-indexed).
#[derive(Tsify, Deserialize, Serialize)]
pub struct Segment {
    /// The type of this segment.
    pub label: String,
    /// 0-indexed start.
    pub start: u32,
    /// 0-indexed stop.
    pub stop: u32
}

impl Segment {
    /// Shift this segment `offset` units to the right.
    /// 
    /// Useful when translating segments of a subsequence to
    /// the whole sequence.
    pub fn offset(self, offset: u32) -> Self {
        Self {
            label: self.label,
            start: offset + self.start,
            stop: offset + self.stop
        }
    }
}

impl FromIterator<Segment> for Graphic {
    fn from_iter<T: IntoIterator<Item = Segment>>(iter: T) -> Self {
        Graphic::Segments(Segments { data: Vec::from_iter(iter) })
    }
}

/// A track of numeric values indexed by residue coordinate.
#[derive(Tsify, Deserialize, Serialize)]
pub struct LinePlot {
    /// Numeric values which are expected to be
    /// spaced by 1 residue per value.
    pub data: Vec<f64>,
    /// The 1-indexed start coordinate, such that
    /// 1 will be plotted in the middle of the first
    /// residue.
    pub start: f64,
}