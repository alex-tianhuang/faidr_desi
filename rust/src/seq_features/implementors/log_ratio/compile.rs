use serde::{Deserialize, Serialize};
use crate::{
    datatypes::{Aminoacid, StandardError},
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::log_ratio::{LogRatio, LogRatioContainer},
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
    type Err = StandardError;
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
            return Err(StandardError::from_str(
                "numerator and denominator are the same",
            ));
        }
        let feature = LogRatio {
            numerator,
            denominator,
        };
        if self.data.contains_key(&feature) {
            Err(StandardError::from_str(&format!(
                "log ratio of {} over {} was defined multiple times",
                feature.numerator, feature.denominator
            )))
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
