"""Checks that every integrity (SRI) hash in src/*.html matches the local file it pins."""
import base64
import glob
import hashlib
import os
import re
import sys

failures = 0
checked = 0
for page in glob.glob(os.path.join("src", "**", "*.html"), recursive=True):
    with open(page, encoding="utf-8") as f:
        html = f.read()
    for tag in re.findall(r"<(?:script|link)\b[^>]*\bintegrity=[^>]*>", html):
        ref = re.search(r'\b(?:src|href)="([^"]+)"', tag).group(1)
        if ref.startswith(("http:", "https:", "//")):
            continue
        algo, expected = re.search(r'\bintegrity="([^"\s]+)', tag).group(1).split("-", 1)
        with open(os.path.join(os.path.dirname(page), ref.split("?")[0]), "rb") as f:
            actual = base64.b64encode(hashlib.new(algo, f.read()).digest()).decode()
        checked += 1
        if actual != expected:
            failures += 1
            print(f"{page}: {ref}: expected {algo}-{expected}, file has {algo}-{actual}")

print(f"checked {checked} integrity hashes, {failures} mismatches")
sys.exit(1 if failures or not checked else 0)
