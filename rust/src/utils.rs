use crate::{adapters::JsValuePreserved, datatypes::aa_canonical_str};
use serde::Serialize;
use tsify::Tsify;
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::js_sys::Error;

/// Return type of [`parse_text_as_sequence`].
#[derive(Tsify, Serialize)]
#[tsify(into_wasm_abi)]
#[serde(tag = "case", rename_all = "kebab-case")]
pub enum ParsedSequence {
    #[serde(rename_all = "camelCase")]
    Ok {
        sequence: String,
        relevant_span: [u32; 2],
    },
    #[serde(rename_all = "camelCase")]
    Error {
        error: JsValuePreserved<Error>,
        relevant_span: [u32; 2],
    },
}
/// Given some text from a text area, parse a sequence from it.
#[wasm_bindgen(js_name = parseTextAsSequence)]
pub fn parse_text_as_sequence(text: String) -> ParsedSequence {
    let mut text = text.into_bytes();
    let (relevant_span, seq) = if text.starts_with(b">") {
        let Some(m) = end_of_current_header(&text) else {
            return ParsedSequence::Error {
                error: JsValuePreserved::new(Error::new("Text area contains only header")),
                relevant_span: [0, 0],
            };
        };
        let rest = &mut text[m..];
        let n = next_start_of_header(&rest).unwrap_or(rest.len());
        (m..m + n, &mut rest[..n])
    } else {
        (0..text.len(), &mut *text)
    };
    let mut seq_buffer = Vec::from(seq);
    match aa_canonical_str::join_multiline(&mut seq_buffer) {
        Ok(seq) => ParsedSequence::Ok {
            sequence: seq.as_str().to_string(),
            relevant_span: [relevant_span.start as u32, relevant_span.end as u32],
        },
        Err(e) => {
            let pos = relevant_span.start + e.at;
            let line_no = text[..pos].iter().filter(|b| **b == b'\n').count() + 1;
            let col_no = match text[..pos].iter().rev().position(|b| *b == b'\n') {
                Some(n) => {
                    let last_line_pos = pos - 1 - n;
                    debug_assert_eq!(text[last_line_pos], b'\n');
                    debug_assert!(text[last_line_pos+1..pos].iter().all(|b| *b != b'\n'));
                    n + 1
                }
                None => pos + 1,
            };
            ParsedSequence::Error {
                error: JsValuePreserved::new(Error::new(&format!(
                    "Cannot parse `{}` as a capitalized aminoacid at line {}, column {}",
                    e.ch, line_no, col_no
                ))),
                relevant_span: [relevant_span.start as u32, relevant_span.end as u32],
            }
        }
    }
}

/// Find the index of the next newline from the beginning of this slice.
fn end_of_current_header(bytes: &[u8]) -> Option<usize> {
    bytes.iter().position(|b| *b == b'\n')
}
/// Find the index of the next newline followed by a `>` character
/// from the beginning of this slice.
fn next_start_of_header(bytes: &[u8]) -> Option<usize> {
    bytes.windows(2).position(|pair| pair == b"\n>")
}
