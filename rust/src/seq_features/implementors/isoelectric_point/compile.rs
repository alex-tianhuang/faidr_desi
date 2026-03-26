
use crate::seq_features::{functionality::compile::{CompilableSeqFeats, CompilerImplementor}, implementors::{DuplicateFeatureError, isoelectric_point::IsoelectricPoint}};

/// A one-feature compiler for isoelectric point.
#[derive(Default)]
pub struct IsoelectricPointCompiler<'a> {
    feature_id: Option<&'a str>
}
impl<'a> CompilerImplementor<'a> for IsoelectricPointCompiler<'a> {
    type Container = IsoelectricPoint;
    type Err = DuplicateFeatureError;
    type UserFacing = ();
    /// Part of the [`CompilableSeqFeats`] template.
    /// 
    /// A one-feature compiler pattern.
    fn compile(&mut self, _data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err> {
        if self.feature_id.is_some() {
            Err(DuplicateFeatureError)
        } else {
            self.feature_id = Some(feature_id);
            Ok(())
        }
    }
    /// Part of the [`CompilableSeqFeats`] template.
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container {
        let enabled = self.feature_id.is_some();
        if let Some(feature_id) = self.feature_id {
            feature_ids.push(feature_id);
        }
        IsoelectricPoint { enabled }
    }
}
impl CompilableSeqFeats for IsoelectricPoint {
    type Compiler<'a> = IsoelectricPointCompiler<'a>;
}