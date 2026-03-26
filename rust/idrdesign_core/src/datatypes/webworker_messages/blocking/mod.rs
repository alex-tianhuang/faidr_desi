//! Module defining [`RequestPayload`] and [`Endpoint`].
use serde::{Deserialize, Serialize};
use tsify::Tsify;
pub mod webworker_featurize;

/// Macro used to define [`RequestPayload`] and [`Endpoint`].
/// 
/// Automatically ensures that [`Endpoint`] variant names are
/// exactly the variant names in [`RequestPayload`].
macro_rules! define_variants {
    ($(use<$lt:lifetime>)? $($(#[$($docs1:tt)*])* $variant:ident($inner_ty:ty)),*) => {
        /// All possible blocking worker endpoints, plus the
        /// necessary data to submit a request at each endpoint.
        #[derive(Tsify, Deserialize, Serialize)]
        #[serde(tag = "endpoint", rename_all = "kebab-case")]
        pub enum RequestPayload$(<$lt>)? {
            $($(#[$($docs1)*])* $variant($inner_ty),)*
        }
        /// Any valid endpoint of the blocking server.
        /// 
        /// Variants mirroring [`RequestPayload`].
        #[derive(Deserialize)]
        #[serde(rename_all = "kebab-case")]
        pub(crate) enum Endpoint {
            $($variant),*
        }
    };
}

define_variants! {
    /// Private endpoint for computing sequence features of many sequences.
    WebworkerFeaturize(webworker_featurize::RequestPayload)
}
