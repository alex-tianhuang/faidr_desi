use crate::datatypes::aa_canonical_str;
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::js_sys::Error;

/// Given some text from a text area, parse a sequence from it.
#[wasm_bindgen(js_name = parseTextAsSequence)]
pub fn parse_text_as_sequence(text: String) -> Result<String, Error> {
    let mut text = text.into_bytes();
    let seq = if text.starts_with(b">") {
        let n = end_of_current_header(&text).ok_or_else(|| Error::new("Text area is empty."))?;
        let rest = &mut text[n..];
        let n = next_start_of_header(&rest).unwrap_or(rest.len());
        &mut rest[..n]
    } else {
        &mut text
    };
    let seq = aa_canonical_str::join_multiline(seq)
        .map_err(|e| Error::new(&format!("Could not parse pasted text as sequence: {}", e)))?;
    Ok(seq.as_str().to_string())
}
/// Given some file text, parse the first sequence from it.
/// 
/// The only part of this that assumes this to be text from
/// a file are the error messages.
#[wasm_bindgen(js_name = parseFirstSequenceOfFasta)]
pub fn parse_first_sequence_of_fasta(file_text: String) -> Result<String, Error> {
    let mut text = file_text.into_bytes();
    let n = end_of_current_header(&text).ok_or_else(|| Error::new("File is empty."))?;
    let rest = &mut text[..n];
    let n = next_start_of_header(&rest).unwrap_or(rest.len());
    let seq = &mut rest[..n];
    let seq = aa_canonical_str::join_multiline(seq)
        .map_err(|e| Error::new(&format!("Could not parse sequence after first header: {}", e)))?;
    Ok(seq.as_str().to_string())
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
