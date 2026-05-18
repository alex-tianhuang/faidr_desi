//! Submodule describing required functionality for sequence features.
//! 
//! For those of you wondering why I overcomplicated the library
//! with this folder full of very complicated unreadable traits:
//!
//! Unlike in traditional object-oriented programming, these
//! traits/interfaces do not present a clean, minimal outward
//! facing function signature. This makes it more work than
//! is worth it to virtualize or attempt to write generic
//! functions that make use of this trait.
//!
//! While it would seem then that this trait is more complex
//! than it's worth, I find this trait does help me describe
//! common logic that I find myself reasoning about sequence
//! features. As of Dec 26th, 2025, that logic includes:
//!
//! 1. Features need to have a marshallable state and
//!    a compiled state. Multiple features of the same type
//!    usually benefit from being folded into an accumulating
//!    container instead of yielding new objects.
//! 2. Probably all containers of compiled features need to take
//!    sequences and return vectors of numbers or errors. In
//!    addition, I speed up computation by using different
//!    information about the sequence for each feature.
//! 3. Some containers of compiled features need to compute
//!    render information, which again can be sped up by
//!    context specific to the type of feature being computed.
//! 4. Every container of compiled features should know its own
//!    dimension, or the number of features it yields.
//!
//! This is a tremendous amount of information to organize,
//! and I anticipate to be adding and updating sequence
//! feature implementors very often.
//!
//! Therefore, the explicit spelling out of these patterns as
//! a really grotesque looking trait gives my linter an
//! easier job of telling me what work I have left to do when
//! I'm adding a new container of features.
pub(crate) mod compile;
pub(crate) mod featurize;
pub(crate) mod featdim;


