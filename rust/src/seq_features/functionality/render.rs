//! Module defining the [`RenderableSeqFeats`] requirement.

use crate::datatypes::{Graphic, aa_canonical_str};

/// This trait specifies the requirement that a feature
/// container can compute some relevant visualizations
/// on a sequence.
///
/// It also specifies that it may fail or may use additional
/// context from the renderer to perform the computation.
pub(crate) trait RenderableSeqFeats: Sized {
    /// Additional context about the sequence required to
    /// make the render calculation faster.
    ///
    /// Context can refer to data with an extremely short lifetime,
    /// typically a temporary mutable ref.
    type Ctx<'a>
    where
        Self: 'a;
    /// Error that may be returned in a falliable computation.
    type Err;
    /// Run the computation on `sequence`, returning as
    /// many values as necessary.
    fn render<'a>(
        &self,
        sequence: &aa_canonical_str,
        ctx: Self::Ctx<'a>,
    ) -> impl Iterator<Item = Result<Graphic, Self::Err>>;
}
