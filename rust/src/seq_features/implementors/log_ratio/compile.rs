use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::{
    datatypes::Aminoacid,
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::{
            DuplicateFeatureError,
            log_ratio::{LogRatio, LogRatioContainer},
        },
    },
};
use std::collections::BTreeMap;
/// A single, marshallable log ratio feature.
#[derive(Deserialize, Serialize)]
pub struct LogRatioUserFacing {
    numerator: Aminoacid,
    denominator: Aminoacid,
}
/// Compiler type for log ratio features.
#[derive(Default)]
pub struct LogRatioCompiler<'a> {
    data: BTreeMap<LogRatio, &'a str>,
}
impl<'a> CompilerImplementor<'a> for LogRatioCompiler<'a> {
    type UserFacing = LogRatioUserFacing;
    type Container = LogRatioContainer;
    type Err = CompileLogRatioError;
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Checks for duplicates and if the numerator / denominator
    /// aminoacids are the same.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let LogRatioUserFacing {
            numerator,
            denominator,
        } = *data;
        if numerator == denominator {
            return Err(CompileLogRatioError::NumeratorAndDenominatorSame);
        }
        let feature = LogRatio {
            numerator,
            denominator,
        };
        if self.data.contains_key(&feature) {
            Err(CompileLogRatioError::DuplicateFeatureError(
                DuplicateFeatureError,
            ))
        } else {
            self.data.insert(feature, feature_id);
            Ok(())
        }
    }
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Returns a log ratio feature container and returns the
    /// order in which the features are arranged.
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        let data = self
            .data
            .into_iter()
            .map(|(feature, feature_id)| {
                feature_ids.push(feature_id);
                feature
            })
            .collect();
        LogRatioContainer { data }
    }
}
impl CompilableSeqFeats for LogRatioContainer {
    type Compiler<'a> = LogRatioCompiler<'a>;
}
#[derive(Debug, Error)]
pub enum CompileLogRatioError {
    #[error("numerator and denominator are the same")]
    NumeratorAndDenominatorSame,
    #[error("{0}")]
    DuplicateFeatureError(DuplicateFeatureError),
}
