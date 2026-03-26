//! Part of the [`CompilableSeqFeats`] template.
//!
//! Code duplicate of the module [`super::super::compile`].
use crate::{
    datatypes::{AASet, sequences::AACanonicalStringStrict},
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::{
            DuplicateFeatureError,
            nardini_spacing::render::{
                NardiniDeltaRenderable, NardiniOmegaRenderable, NardiniSpacingRenderable,
            },
        },
    },
};
use serde::Deserialize;
use std::mem;
use thiserror::Error;

/// See [`super::super::compile::NardiniSpacingUserFacing`], but with
/// types not containing RNG + number of scrambles.
pub enum NardiniSpacingRenderableUserFacing {
    Delta(NardiniDeltaRenderableUserFacing),
    Omega(NardiniOmegaRenderableUserFacing),
}
/// [`super::super::compile::NardiniDeltaUserFacing`] but without
/// RNG + number of scrambles.
#[derive(Deserialize)]
pub struct NardiniDeltaRenderableUserFacing {
    res_group_a: AACanonicalStringStrict,
    res_group_b: AACanonicalStringStrict,
    window_size: u32,
}
/// [`super::super::compile::NardiniOmegaUserFacing`] but without
/// RNG + number of scrambles.
#[derive(Deserialize)]
pub struct NardiniOmegaRenderableUserFacing {
    res_group: AACanonicalStringStrict,
    window_size: u32,
}
/// Compiler type for the module.
#[derive(Default)]
pub struct NardiniSpacingRenderableCompiler<'a> {
    deltas: Vec<(&'a str, NardiniDeltaRenderable)>,
    omegas: Vec<(&'a str, NardiniOmegaRenderable)>,
}
impl<'a> CompilerImplementor<'a> for NardiniSpacingRenderableCompiler<'a> {
    type UserFacing = NardiniSpacingRenderableUserFacing;
    type Container = NardiniSpacingRenderable;
    type Err = CompileNardiniSpacingError;
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Code duplicate of [`super::super::compile::NardiniSpacingCompiler::compile`].
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let NardiniSpacingRenderableCompiler { deltas, omegas } = self;
        match data {
            NardiniSpacingRenderableUserFacing::Delta(data) => {
                let feature = compile_delta(data)?;
                if deltas
                    .iter()
                    .find(|(_, other_feature)| feature == *other_feature)
                    .is_some()
                {
                    Err(CompileNardiniSpacingError::DuplicateFeatureError(
                        DuplicateFeatureError,
                    ))
                } else {
                    deltas.push((feature_id, feature));
                    Ok(())
                }
            }
            NardiniSpacingRenderableUserFacing::Omega(data) => {
                let feature = NardiniOmegaRenderable {
                    res_group: data.res_group.into_iter().collect(),
                    window_size: data.window_size,
                };
                if omegas
                    .iter()
                    .find(|(_, other_feature)| feature == *other_feature)
                    .is_some()
                {
                    Err(CompileNardiniSpacingError::DuplicateFeatureError(
                        DuplicateFeatureError,
                    ))
                } else {
                    omegas.push((feature_id, feature));
                    Ok(())
                }
            }
        }
    }
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Generates a [`NardiniSpacingRenderable`] and returns
    /// feature IDs of delta features then omega features.
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        let deltas = self
            .deltas
            .into_iter()
            .map(|(feature_id, feature)| {
                feature_ids.push(feature_id);
                feature
            })
            .collect();
        let omegas = self
            .omegas
            .into_iter()
            .map(|(feature_id, feature)| {
                feature_ids.push(feature_id);
                feature
            })
            .collect();
        NardiniSpacingRenderable { deltas, omegas }
    }
}
impl CompilableSeqFeats for NardiniSpacingRenderable {
    type Compiler<'a> = NardiniSpacingRenderableCompiler<'a>;
}
/// Helper function for [`NardiniSpacingCompiler::compile`].
///
/// Checks for overlapping residue groups, returning an
/// error on finding any overlap.
///
/// Otherwise returns an simple spacing delta feature,
/// enforcing the convention that `res_group_a` < `res_group_b`
/// (as the feature is symmetric in the two residue groups).
fn compile_delta(
    data: &NardiniDeltaRenderableUserFacing,
) -> Result<NardiniDeltaRenderable, CompileNardiniSpacingError> {
    let NardiniDeltaRenderableUserFacing {
        ref res_group_a,
        ref res_group_b,
        window_size,
    } = *data;
    let mut res_group_a = res_group_a.into_iter().collect::<AASet>();
    let mut res_group_b = res_group_b.into_iter().collect::<AASet>();
    if res_group_a.iter().any(|aa| res_group_b.contains(aa)) {
        return Err(CompileNardiniSpacingError::OverlappingResGroups);
    }
    if res_group_a > res_group_b {
        mem::swap(&mut res_group_a, &mut res_group_b)
    }
    Ok(NardiniDeltaRenderable {
        res_group_a,
        res_group_b,
        window_size,
    })
}
/// Error returned when compiling a NARDINI spacing feature.
#[derive(Debug, Error)]
pub enum CompileNardiniSpacingError {
    #[error("residue groups for delta feature have residues in common")]
    OverlappingResGroups,
    #[error("{0}")]
    DuplicateFeatureError(DuplicateFeatureError),
}
