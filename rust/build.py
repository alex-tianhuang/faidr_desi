import os
import subprocess as sp
import toml
import argparse
ap = argparse.ArgumentParser()
ap.add_argument("--release", action="store_true")
release = ap.parse_args().release
HERE = os.path.dirname(__file__)
wasm_dir = f"{HERE}/../js/src/backend/rust/"
pk_name: str = toml.load("Cargo.toml")["package"]["name"].replace(
    "-", "_"
)
build_args = [
    "cargo",
    "build",
    "--target",
    "wasm32-unknown-unknown",
]
if release:
    build_args.append("--release")
sp.run(build_args, check=True)
build_path = f"{HERE}/target/wasm32-unknown-unknown"
if release:
    build_path += "/release"
else:
    build_path += "/debug"
build_path += "/{}.wasm".format(pk_name)
if not os.path.exists(build_path):
    raise RuntimeError("can't find wasm file: {}".format(build_path))

bindgen_args = [
    "wasm-bindgen",
    build_path,
    "--out-dir",
    wasm_dir,
    "--typescript",
    "--target",
    "web",
]
sp.run(bindgen_args, check=True)