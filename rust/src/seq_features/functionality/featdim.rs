/// Requirement that a feature container know the number
/// of features it yields.
pub(crate) trait FeatDim {
    /// The number of features yielded by this container,
    /// used in allocations.
    fn featdim(&self) -> usize;
    /// True if there are features to be computed in the container.
    /// False if the container is equivalent to a no-op.
    fn has_features(&self) -> bool {
        self.featdim() > 0
    }
}
