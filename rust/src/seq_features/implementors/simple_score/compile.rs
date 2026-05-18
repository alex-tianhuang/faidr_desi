use std::convert::Infallible;

use serde::{Deserialize, Serialize};

use crate::{
    JSFacingAAMap,
    datatypes::AAMap,
    seq_features::{
        functionality::compile::{CompilableSeqFeats, CompilerImplementor},
        implementors::simple_score::SimpleScore,
    },
};

/// A single feature representing a weighted sum
/// over residue counts.
///
/// Supports optional averaging.
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SimpleScoreUserFacing {
    weights: JSFacingAAMap<f64>,
    take_average: bool,
}
/// A compiler type for these weighted residue count features.
#[derive(Default)]
pub struct SimpleScoreCompiler<'a> {
    sums: Vec<(&'a str, AAMap<f64>)>,
    averages: Vec<(&'a str, AAMap<f64>)>,
}
impl<'a> CompilerImplementor<'a> for SimpleScoreCompiler<'a> {
    type Container = SimpleScore;
    type Err = Infallible;
    type UserFacing = SimpleScoreUserFacing;
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Adds a single simple score feature, checking for uniqueness.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        let dest = match data.take_average {
            false => &mut self.sums,
            true => &mut self.averages,
        };
        dest.push((feature_id, AAMap::clone(&data.weights)));
        Ok(())
    }
    /// Part of the [`CompilableSeqFeats`] template.
    ///
    /// Returns feature IDs grouped by whether averages are taken or not,
    /// same order as features will be computed.
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        let mut sums = Vec::with_capacity(self.sums.len());
        let mut averages = Vec::with_capacity(self.averages.len());
        for (feature_id, s) in self.sums {
            feature_ids.push(feature_id);
            sums.push(s);
        }
        for (feature_id, s) in self.averages {
            feature_ids.push(feature_id);
            averages.push(s);
        }
        SimpleScore { sums, averages }
    }
}
impl CompilableSeqFeats for SimpleScore {
    type Compiler<'a> = SimpleScoreCompiler<'a>;
}
