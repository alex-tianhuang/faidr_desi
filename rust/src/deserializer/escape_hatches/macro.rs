/// Boilerplate for defining a struct `Magic` that
/// expects a magic string (extremely unlikely to occur
/// outside of this crate except adversarially).
macro_rules! define_magic_token {
    ($magic_t:ident, $magic_const:ident) => {
        #[allow(unused)]
        pub struct $magic_t;
        impl<'de> serde::Deserialize<'de> for $magic_t {
            fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
            where
                D: serde::Deserializer<'de>,
            {
                struct Visitor;
                impl<'de> serde::de::Visitor<'de> for Visitor {
                    type Value = $magic_t;
                    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                        formatter.write_str("a magic string from the `escape_hatches` submodule")
                    }
                    fn visit_str<E>(self, s: &str) -> Result<Self::Value, E>
                    where
                        E: serde::de::Error,
                    {
                        if s == $magic_const {
                            Ok($magic_t)
                        } else {
                            Err(E::invalid_value(serde::de::Unexpected::Str(s), &self))
                        }
                    }
                }
                serde::Deserializer::deserialize_str(deserializer, Visitor)
            }
        }
    };
}
/// Boilerplate for defining a struct `SeqAccess`
/// that yields exactly the type-erased information
/// that the escape-hatch tuple struct expects.
macro_rules! define_seq_access {
    ($seq_access:ident$(<$de:lifetime>)?, $magic_const:ident, |$first_variant:ident(($first_arg:pat): $first_t:ty)| $b1:expr$(, |$subsequent_variant:ident(($subsequent_arg:pat): $subsequent_t:ty)| $b2:expr)*) => {
        #[allow(unused)]
        pub enum $seq_access$(<$de>)? {
            OnMagic($first_t),
            $first_variant($first_t),
            $($subsequent_variant($subsequent_t),)*
            Done
        }
        impl<'de> serde::de::SeqAccess<'de> for $seq_access$(<$de>)? {
            type Error = serde_wasm_bindgen::Error;

            fn next_element_seed<T: serde::de::DeserializeSeed<'de>>(
                &mut self,
                seed: T,
            ) -> Result<Option<T::Value>, Self::Error> {
                let this = std::mem::replace(self, Self::Done);
                match this {
                    Self::OnMagic(data) => {
                        *self = Self::$first_variant(data);
                        seed.deserialize(serde::de::IntoDeserializer::into_deserializer($magic_const))
                            .map(Some)
                    }
                    Self::$first_variant($first_arg) => {
                        let (this, data) = $b1;
                        *self = this;
                        seed.deserialize(serde::de::IntoDeserializer::into_deserializer(data))
                            .map(Some)
                    }
                    $(
                        Self::$subsequent_variant($subsequent_arg) => {
                            let (this, data) = $b2;
                            *self = this;
                            seed.deserialize(serde::de::IntoDeserializer::into_deserializer(data))
                                .map(Some)
                        }
                    )*
                    Self::Done => Ok(None),
                }
            }
        }
    };
}
/// Boilerplate for defining an escape-hatch struct
/// for extracting type information out of a generic
/// deserializer.
macro_rules! define_escape_hatch {
    ($(#[doc = $($doc:tt)*])? $escape_hatch:ident, $magic_t:ident, $magic_const:ident, $expecting:expr, $num_fields:literal, $($escape_hatch_t:ty),+) => {
        #[allow(unused)]
        $(#[doc = $($doc)*])?
        pub struct $escape_hatch($magic_t, $($escape_hatch_t),+);

        impl<'de> serde::de::Deserialize<'de> for $escape_hatch {
            fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
            where
                D: serde::Deserializer<'de>,
            {
                struct Visitor;
                impl Visitor {
                    #[cold]
                    fn error_foreign_deserializer_in_use<E: serde::de::Error>(self) -> E {
                        serde::de::Error::custom(
                            format!("`{}` cannot be constructed using deserializers outside of the `escape_hatches` submodule", stringify!($escape_hatch)),
                        )
                    }
                }
                impl<'de> serde::de::Visitor<'de> for Visitor {
                    type Value = $escape_hatch;
                    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                        formatter.write_str($expecting.as_ref())
                    }
                    #[track_caller]
                    fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
                    where
                        A: serde::de::SeqAccess<'de>,
                    {
                        if !crate::deserializer::escape_hatches::trusted::caller_is_trusted() {
                            return Err(self.error_foreign_deserializer_in_use());
                        }
                        const EXPECTED: &'static str = stringify!(tuple struct $escape_hatch with $num_fields elements);
                        match seq.next_element::<$magic_t>()? {
                            Some(_) => (),
                            None => {
                                return Err(serde::de::Error::invalid_length(
                                    0,
                                    &EXPECTED,
                                ));
                            }
                        };
                        let mut elements_yielded = 1;
                        Ok($escape_hatch(
                            Magic,
                            $(match seq.next_element::<$escape_hatch_t>()? {
                                #[allow(unused)]
                                Some(field) => {
                                    elements_yielded += 1;
                                    field
                                },
                                None => {
                                    return Err(serde::de::Error::invalid_length(
                                        elements_yielded,
                                        &EXPECTED,
                                    ));
                                }
                            }),+
                        ))
                    }
                }
                serde::de::Deserializer::deserialize_tuple_struct(deserializer, $magic_const, $num_fields, Visitor)
            }
        }
    };
}
/// Boilerplate for defining:
/// 1. An "escape-hatch" tuple struct, which contains several numbers
///    whose bits correspond to type-erased data about the deserializer.
/// 2. A [`serde::de::SeqAccess`] implementor, which is exactly suited to
///    deserialize to the escape-hatch tuple struct defined in (1).
macro_rules! escape_hatch_boilerplate {
    ($(#[doc = $($doc:tt)*])? $escape_hatch:ident$(<$de:lifetime>)?, $magic_const:ident, $expecting:expr, $num_fields:literal, |$first_variant:ident(($first_arg:pat): $first_t:ty)| $b1:block as (Self, $first_escape_hatch_t:ty)$(, |$subsequent_variant:ident(($subsequent_arg:pat): $subsequent_t:ty)| $b2:block as (Self, $subsequent_escape_hatch_t:ty))*) => {
        crate::deserializer::escape_hatches::r#macro::define_magic_token!(Magic, $magic_const);
        crate::deserializer::escape_hatches::r#macro::define_seq_access!(SeqAccess$(<$de>)?, $magic_const, |$first_variant(($first_arg): $first_t)| $b1$(, |$subsequent_variant(($subsequent_arg): $subsequent_t)| $b2)*);
        crate::deserializer::escape_hatches::r#macro::define_escape_hatch!($(#[doc = $($doc)*])? $escape_hatch, Magic, $magic_const, $expecting, $num_fields, $first_escape_hatch_t$(, $subsequent_escape_hatch_t)*);
    };
}
pub(super) use {define_magic_token, define_escape_hatch, define_seq_access, escape_hatch_boilerplate};
