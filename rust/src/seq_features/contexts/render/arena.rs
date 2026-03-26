use bumpalo::Bump;
use regex::Regex;
use crate::datatypes::{Aminoacid, aa_canonical_str, render::Segment};
use bumpalo::collections::Vec;

/// Get **unnamed** segments of residues that are all of some residue group / kind.
///
/// The inclusion criteria of these segments is specified by `filter`.
pub fn get_simple_segments<'a>(
    arena: &'a Bump,
    sequence: &aa_canonical_str,
    filter: impl Fn(Aminoacid) -> bool,
) -> impl 'a + ExactSizeIterator<Item = Segment> {
    let mut buf = Vec::with_capacity_in(sequence.len(), arena);
    let mut segment_start = None;
    for (idx, aa) in sequence.into_iter().enumerate() {
        let in_segment = filter(aa);
        if in_segment {
            if segment_start.is_none() {
                segment_start = Some(idx as u32)
            }
        } else {
            if let Some(start) = segment_start.take() {
                let stop = idx as u32;
                buf.push(Segment {
                    label: String::new(),
                    start,
                    stop,
                });
            }
        }
    }
    if let Some(start) = segment_start {
        let stop = sequence.len() as u32;
        buf.push(Segment {
            label: String::new(),
            start,
            stop,
        });
    }
    buf.into_iter()
}
/// Get **unnamed** segments of residues matching a regex.
pub fn get_regex_segments<'a>(
    arena: &'a Bump,
    sequence: &aa_canonical_str,
    pattern: &Regex,
) -> impl 'a + ExactSizeIterator<Item = Segment> {
    let mut buf = Vec::with_capacity_in(sequence.len(), arena);
    for m in pattern.find_iter(sequence.as_str()) {
        buf.push(Segment {
            label: String::new(),
            start: m.start() as u32,
            stop: m.end() as u32,
        });
    }
    buf.into_iter()
}