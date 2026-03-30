use crate::{
    datatypes::{AASet, sequences::AACanonicalStringStrict},
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::{
            DuplicateFeatureError,
            nardini_spacing::{NardiniCommonParams, NardiniDelta, NardiniOmega, NardiniSpacing},
        },
    },
};
use serde::{Deserialize, Deserializer, Serialize};
use std::mem;
use thiserror::Error;

/// A single NARDINI spacing feature.
///
/// Each variant is marshallable, but in order to fit the
/// [`CompilableSeqFeats`] template I bundled them into
/// this one type.
///
/// Deserialize with [`deserialize_nardini_delta`] or
/// [`deserialize_nardini_omega`].
#[derive(Serialize)]
#[serde(untagged)]
pub enum NardiniSpacingUserFacing {
    Delta(NardiniDeltaUserFacing),
    Omega(NardiniOmegaUserFacing),
}
/// A single NARDINI spacing feature that computes
/// the clustering of two opposing residue groups.
///
/// See [`NardiniDelta`] and [`super`] module
/// level docs.
#[derive(Deserialize, Serialize)]
pub struct NardiniDeltaUserFacing {
    res_group_a: AACanonicalStringStrict,
    res_group_b: AACanonicalStringStrict,
    #[serde(flatten)]
    params: NardiniCommonParams,
}
/// Deserialize a [`NardiniDeltaUserFacing`] but put it
/// into a [`NardiniSpacingUserFacing`].
///
/// This is kind of stupid (wastes space and possibly makes
/// an unreachable code branch) but makes it possible to use
/// a single [`CompilerImplementor`] to compile two types of
/// very related features.
pub fn deserialize_nardini_delta<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<NardiniSpacingUserFacing, D::Error> {
    NardiniDeltaUserFacing::deserialize(deserializer).map(NardiniSpacingUserFacing::Delta)
}
/// Deserialize a [`NardiniOmegaUserFacing`] but put it
/// into a [`NardiniSpacingUserFacing`].
///
/// This is kind of stupid (wastes space and possibly makes
/// an unreachable code branch) but makes it possible to use
/// a single [`CompilerImplementor`] to compile two types of
/// very related features.
pub fn deserialize_nardini_omega<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<NardiniSpacingUserFacing, D::Error> {
    NardiniOmegaUserFacing::deserialize(deserializer).map(NardiniSpacingUserFacing::Omega)
}
/// A single NARDINI spacing feature that computes
/// the clustering of one residue group.
///
/// See [`NardiniOmega`] and [`super`] module
/// level docs.
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NardiniOmegaUserFacing {
    res_group: AACanonicalStringStrict,
    #[serde(flatten)]
    params: NardiniCommonParams,
}
/// A compiler type for NARDINI spacing features.
#[derive(Default)]
pub struct NardiniSpacingCompiler<'a> {
    deltas: Vec<(&'a str, NardiniDelta)>,
    omegas: Vec<(&'a str, NardiniOmega)>,
}
impl<'a> CompilerImplementor<'a> for NardiniSpacingCompiler<'a> {
    type UserFacing = NardiniSpacingUserFacing;
    type Container = NardiniSpacing;
    type Err = CompileNardiniSpacingError;
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Takes either a [`NardiniDeltaUserFacing`]
    /// or a [`NardiniOmegaUserFacing`] struct and compiles
    /// it into this collection, checking for uniqueness
    /// and non-overlap of residue groups in delta features.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let NardiniSpacingCompiler { deltas, omegas } = self;
        match data {
            NardiniSpacingUserFacing::Delta(data) => {
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
            NardiniSpacingUserFacing::Omega(data) => {
                let feature = NardiniOmega {
                    res_group: data.res_group.into_iter().collect(),
                    params: data.params.clone(),
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
    /// Generates a [`NardiniSpacing`] and returns
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
        NardiniSpacing { deltas, omegas }
    }
}
impl CompilableSeqFeats for NardiniSpacing {
    type Compiler<'a> = NardiniSpacingCompiler<'a>;
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
    data: &NardiniDeltaUserFacing,
) -> Result<NardiniDelta, CompileNardiniSpacingError> {
    let NardiniDeltaUserFacing {
        res_group_a,
        res_group_b,
        params,
    } = data;
    let mut res_group_a = res_group_a.into_iter().collect::<AASet>();
    let mut res_group_b = res_group_b.into_iter().collect::<AASet>();
    if res_group_a.iter().any(|aa| res_group_b.contains(aa)) {
        return Err(CompileNardiniSpacingError::OverlappingResGroups);
    }
    if res_group_a > res_group_b {
        mem::swap(&mut res_group_a, &mut res_group_b)
    }
    Ok(NardiniDelta {
        res_group_a,
        res_group_b,
        params: params.clone(),
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
