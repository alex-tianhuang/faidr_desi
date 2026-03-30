use std::mem;

use crate::{
    datatypes::{AASet, sequences::AACanonicalStringStrict},
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::{
            DuplicateFeatureError,
            simple_spacing::{SimpleSpacingContainer, SimpleSpacingDelta, SimpleSpacingOmega},
        },
    },
};
use serde::{Deserialize, Deserializer, Serialize};
use thiserror::Error;

/// A single simple-spacing feature.
///
/// Each variant is marshallable, but in order to fit the
/// [`CompilableSeqFeats`] template I bundled them into
/// this one type.
#[derive(Serialize)]
#[serde(untagged)]
pub enum SimpleSpacingUserFacing {
    Delta(SimpleSpacingDeltaUserFacing),
    Omega(SimpleSpacingOmegaUserFacing),
}
/// A single simple-spacing feature that computes
/// the clustering of two opposing residue groups.
///
/// See [`SimpleSpacingDelta`] and [`super`] module
/// level docs.
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SimpleSpacingDeltaUserFacing {
    res_group_a: AACanonicalStringStrict,
    res_group_b: AACanonicalStringStrict,
    blob_size: u32,
}
/// A single simple-spacing feature that computes
/// the clustering of one residue group.
///
/// See [`SimpleSpacingOmega`] and [`super`] module
/// level docs.
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SimpleSpacingOmegaUserFacing {
    res_group: AACanonicalStringStrict,
    blob_size: u32,
}
/// Deserialize a [`SimpleSpacingOmegaUserFacing`] but put it
/// into a [`SimpleSpacingUserFacing`].
///
/// This is kind of stupid (wastes space and possibly makes
/// an unreachable code branch) but makes it possible to use
/// a single [`CompilerImplementor`] to compile two types of
/// very related features.
pub fn deserialize_simple_spacing_delta<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<SimpleSpacingUserFacing, D::Error> {
    SimpleSpacingDeltaUserFacing::deserialize(deserializer).map(SimpleSpacingUserFacing::Delta)
}
/// Deserialize a [`SimpleSpacingOmegaUserFacing`] but put it
/// into a [`SimpleSpacingUserFacing`].
///
/// This is kind of stupid (wastes space and possibly makes
/// an unreachable code branch) but makes it possible to use
/// a single [`CompilerImplementor`] to compile two types of
/// very related features.
pub fn deserialize_simple_spacing_omega<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<SimpleSpacingUserFacing, D::Error> {
    SimpleSpacingOmegaUserFacing::deserialize(deserializer).map(SimpleSpacingUserFacing::Omega)
}
/// A compiler type for simple-spacing features.
#[derive(Default)]
pub struct SimpleSpacingCompiler<'a> {
    deltas: Vec<(&'a str, SimpleSpacingDelta)>,
    omegas: Vec<(&'a str, SimpleSpacingOmega)>,
}
impl<'a> CompilerImplementor<'a> for SimpleSpacingCompiler<'a> {
    type UserFacing = SimpleSpacingUserFacing;
    type Container = SimpleSpacingContainer;
    type Err = CompileSimpleSpacingError;
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Takes either a [`SimpleSpacingDeltaUserFacing`]
    /// or a [`SimpleSpacingOmegaUserFacing`] struct and compiles
    /// it into this collection, checking for uniqueness
    /// and non-overlap of residue groups in delta features.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let SimpleSpacingCompiler { deltas, omegas } = self;
        match data {
            SimpleSpacingUserFacing::Delta(data) => {
                let feature = compile_delta(data)?;
                if deltas
                    .iter()
                    .find(|(_, other_feature)| feature == *other_feature)
                    .is_some()
                {
                    Err(CompileSimpleSpacingError::DuplicateFeatureError(
                        DuplicateFeatureError,
                    ))
                } else {
                    deltas.push((feature_id, feature));
                    Ok(())
                }
            }
            SimpleSpacingUserFacing::Omega(data) => {
                let feature = SimpleSpacingOmega {
                    res_group: data.res_group.into_iter().collect(),
                    blob_size: data.blob_size,
                };
                if omegas
                    .iter()
                    .find(|(_, other_feature)| feature == *other_feature)
                    .is_some()
                {
                    Err(CompileSimpleSpacingError::DuplicateFeatureError(
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
    /// Generates a [`SimpleSpacingContainer`] and returns
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
        SimpleSpacingContainer { deltas, omegas }
    }
}
impl CompilableSeqFeats for SimpleSpacingContainer {
    type Compiler<'a> = SimpleSpacingCompiler<'a>;
}
/// Helper function for [`SimpleSpacingCompiler::compile`].
///
/// Checks for overlapping residue groups, returning an
/// error on finding any overlap.
///
/// Otherwise returns an simple spacing delta feature,
/// enforcing the convention that `res_group_a` < `res_group_b`
/// (as the feature is symmetric in the two residue groups).
fn compile_delta(
    data: &SimpleSpacingDeltaUserFacing,
) -> Result<SimpleSpacingDelta, CompileSimpleSpacingError> {
    let SimpleSpacingDeltaUserFacing {
        ref res_group_a,
        ref res_group_b,
        blob_size,
    } = *data;
    let mut res_group_a = res_group_a.into_iter().collect::<AASet>();
    let mut res_group_b = res_group_b.into_iter().collect::<AASet>();
    if res_group_a.iter().any(|aa| res_group_b.contains(aa)) {
        return Err(CompileSimpleSpacingError::OverlappingResGroups);
    }
    if res_group_a > res_group_b {
        mem::swap(&mut res_group_a, &mut res_group_b)
    }
    Ok(SimpleSpacingDelta {
        res_group_a,
        res_group_b,
        blob_size,
    })
}
/// Error returned when compiling a simple-spacing feature.
#[derive(Debug, Error)]
pub enum CompileSimpleSpacingError {
    #[error("residue groups for simple spacing delta have residues in common")]
    OverlappingResGroups,
    #[error("{0}")]
    DuplicateFeatureError(DuplicateFeatureError),
}
