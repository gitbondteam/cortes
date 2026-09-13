import json
import re
from pathlib import Path

import torch
from PIL import Image
from RealESRGAN import RealESRGAN

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "upscale-test-white"
MAX_DIMENSION = 1600


def source_path():
    catalog = (ROOT / "src/data/products.ts").read_text()
    entries = dict(re.findall(r"slug: '([^']+)'[\s\S]*?image: '([^']+)'", catalog))
    return ROOT / "public" / entries["tomahawk"].lstrip("/")


def main():
    OUTPUT.mkdir(exist_ok=True)
    source = source_path()
    with Image.open(source) as original:
        original_size = original.size
        alpha_present = "A" in original.getbands()
        original_bytes = source.stat().st_size
        white = Image.new("RGBA", original.size, "white")
        flattened = Image.alpha_composite(white, original.convert("RGBA")).convert("RGB")

    model = RealESRGAN(torch.device("cpu"), scale=4)
    model.load_weights("weights/RealESRGAN_x4.pth", download=True)
    enhanced = model.predict(flattened)
    inference_size = enhanced.size
    factor = min(1, MAX_DIMENSION / max(enhanced.size))
    final_size = tuple(round(value * factor) for value in enhanced.size)
    if final_size != enhanced.size:
        enhanced = enhanced.resize(final_size, Image.Resampling.LANCZOS)

    output = OUTPUT / "tomahawk-white-bg.png"
    enhanced.convert("RGB").save(output, "PNG")
    with Image.open(output) as verified:
        report = {
            "source": str(source.relative_to(ROOT)),
            "original_dimensions": original_size,
            "inference_dimensions": inference_size,
            "final_dimensions": verified.size,
            "format": verified.format,
            "original_bytes": original_bytes,
            "final_bytes": output.stat().st_size,
            "source_alpha_present": alpha_present,
            "transparency_removed_intentionally": True,
            "output_has_alpha": "A" in verified.getbands(),
            "decodes": verified.load() is not None,
            "quality_note": "Opaque white compositing removes alpha-recombination mattes; inspect artifact for model oversharpening.",
        }
    (OUTPUT / "report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
