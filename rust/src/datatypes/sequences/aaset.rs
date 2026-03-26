//! Module defining the [`AASet`] type.

use std::{borrow::Borrow, fmt::Debug, hash::Hash};

use crate::datatypes::{AAIndex, AAMap, AMINOACIDS, Aminoacid};

/// A set type for [`Aminoacid`]s.
///
/// Usage
/// -----
///
/// Construct like this:
/// ```
/// let s = AASet::from_iter([Aminoacid::R, Aminoacid::S]);
/// ```
/// or like this:
/// ```
/// let mut s = AASet::default();
/// assert!(s.add(Aminoacid::T));
/// ```
/// Iterate over its members like this:
/// ```
/// for aa in s {
///     /* ... */
/// }
/// ```
///
/// Implementation
/// --------------
/// Light wrapper over [`AAMap`].
///
/// One day I can maybe be convinced to bring back
/// a fun, space efficient, and possibly more
/// compute heavy `u32` representation but not today.
#[derive(Clone, Default)]
pub struct AASet {
    data: AAMap<bool>,
    len: u8,
}

impl AASet {
    /// Add an `Aminoacid` to the set.
    ///
    /// Returns true if it was not already present in the set.
    pub fn add(&mut self, aa: Aminoacid) -> bool {
        if self.data[aa] {
            return false;
        }
        self.data[aa] = true;
        self.len += 1;
        true
    }
    /// Remove an `Aminoacid` from the set.
    ///
    /// Returns true if it was present in the set before.
    pub fn remove(&mut self, aa: Aminoacid) -> bool {
        if !self.data[aa] {
            return false;
        }
        self.data[aa] = false;
        self.len -= 1;
        true
    }
    /// Return the number of members of this set.
    pub fn len(&self) -> u8 {
        self.len
    }
    /// Iterate over this `AASet` from a reference.
    pub fn iter(&self) -> Iter<&AASet> {
        self.into_iter()
    }

    /// Utility method for displaying this as string.
    pub fn to_string(&self) -> String {
        let mut s = String::with_capacity(self.len() as usize);
        for aa in self {
            s.push(aa as u8 as char)
        }
        s
    }
    /// True if `aa` is in the set.
    pub fn contains(&self, aa: Aminoacid) -> bool {
        self.contains_aaidx(aa.to_aaindex())
    }
    /// True if the slot at `aaindex` is true.
    fn contains_aaidx(&self, aaindex: AAIndex) -> bool {
        self.data.0[aaindex as usize]
    }
    /// Compute the union of two aminoacid sets.
    pub fn union(&self, other: &AASet) -> AASet {
        let mut u = self.clone();
        u.extend(other);
        u
    }
}
impl Debug for AASet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_set().entries(self).finish()
    }
}
impl Extend<Aminoacid> for AASet {
    fn extend<T: IntoIterator<Item = Aminoacid>>(&mut self, iter: T) {
        if self.len() == AMINOACIDS.len() as u8 {
            return;
        }
        for aa in iter {
            if self.add(aa) {
                if self.len() == AMINOACIDS.len() as u8 {
                    return;
                }
            }
        }
    }
}
impl Hash for AASet {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.data.0.hash(state);
    }
}
impl PartialEq for AASet {
    fn eq(&self, other: &Self) -> bool {
        self.data.eq(&other.data)
    }
}
impl Eq for AASet {}
impl PartialOrd for AASet {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        self.data.0.partial_cmp(&other.data.0)
    }
}
impl FromIterator<Aminoacid> for AASet {
    fn from_iter<T: IntoIterator<Item = Aminoacid>>(iter: T) -> Self {
        let mut this = Self::default();
        this.extend(iter);
        this
    }
}
impl<'a> IntoIterator for &'a AASet {
    type IntoIter = Iter<&'a AASet>;
    type Item = Aminoacid;
    fn into_iter(self) -> Self::IntoIter {
        Iter {
            residues: self,
            cursor: Some(AAIndex::MIN),
        }
    }
}
impl IntoIterator for AASet {
    type IntoIter = Iter<AASet>;
    type Item = Aminoacid;
    fn into_iter(self) -> Self::IntoIter {
        Iter {
            residues: self,
            cursor: Some(AAIndex::MIN),
        }
    }
}
/// The iterator type over aminoacids in a [`AASet`].
pub struct Iter<B: Borrow<AASet>> {
    residues: B,
    cursor: Option<AAIndex>,
}
impl<B: Borrow<AASet>> Iterator for Iter<B> {
    type Item = Aminoacid;
    fn next(&mut self) -> Option<Self::Item> {
        while let Some(aaindex) = self.cursor {
            self.cursor = aaindex.step();
            if self.residues.borrow().contains_aaidx(aaindex) {
                return Some(aaindex.to_aminoacid());
            }
        }
        None
    }
}
