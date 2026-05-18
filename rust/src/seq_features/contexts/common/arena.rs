use bumpalo::Bump;
/// Resuable memory.
/// 
/// I use this instead of a raw [`Bump`] to make sure
/// I reset the arena regularly.
pub struct ArenaCtx<'a>(&'a mut Bump);
impl<'a> ArenaCtx<'a> {
    /// Public constructor.
    pub fn new(arena: &'a mut Bump) -> Self {
        Self(arena)
    }
    /// Reset and return the underlying memory arena.
    pub fn get_memory(&mut self) -> &Bump {
        self.0.reset();
        &*self.0
    }
}
