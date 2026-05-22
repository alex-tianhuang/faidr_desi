/// This trait specifies the requirement that a feature
/// container has an associated type that compiles it.
pub(crate) trait CompilableSeqFeats {
    /// Type that this feature to compiles from.
    type Compiler<'a>: CompilerImplementor<'a, Container = Self>;
}
/// This trait is for a compiler of a feature container.
/// 
/// This takes  user-facing, marshallable data structs
/// and folds them into this struct, finishing once there
/// are no more.
pub(crate) trait CompilerImplementor<'a>: Default {
    /// The user-facing, marshallable type.
    type UserFacing;
    /// Error when adding a single marshallable type into the compiler.
    type Err;
    /// The type to be compiled to eventually.
    type Container;
    /// Fold one user-facing feature into the compiler.
    fn compile(&mut self, data: &Self::UserFacing, feature_id: &'a str) -> Result<(), Self::Err>;
    /// Finish the compiler, extending the given buffer of feature IDs
    /// (not necessarily in the order they were given).
    fn finish(self, feature_ids: &mut Vec<&'a str>) -> Self::Container;
}
