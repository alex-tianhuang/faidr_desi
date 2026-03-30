use thiserror::Error;
pub(crate) mod isoelectric_point;
pub(crate) mod log_ratio;
pub(crate) mod nardini_spacing;
pub(crate) mod percent_resgroup;
pub(crate) mod percent_residue;
pub(crate) mod repeat_spans;
pub(crate) mod regex_motifs;
pub(crate) mod sequence_charge_decoration;
pub(crate) mod sequence_complexity;
pub(crate) mod sequence_hydropathy_decoration;
pub(crate) mod simple_score;
pub(crate) mod simple_spacing;
/// Token to signify that two identical features are
/// being used in a sequence feature container.
#[derive(Debug, Error)]
#[error("feature with identical parameters already exists")]
pub struct DuplicateFeatureError;
