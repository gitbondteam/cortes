import json
import re
from pathlib import Path

import torch
from PIL import Image
from RealESRGAN import RealESRGAN

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "products-detail-output"
MAX_DIMENSION = 1600
WEBP_QUALITY = 88
MANUAL_REVIEW = {"aranita", "corte-americano", "tomahawk"}


def source_paths():
    catalog = (ROOT / "src/data/products.ts").read_text()
    entries = re.findall(r"slug: '([^']+)'[\s\S]*?image: '([^']+)'", catalog)
    return [(slug, ROOT / "public" / path.lstrip("/")) for slug, path in entries]


def main():
    OUTPUT.mkdir(exist_ok=True)
    model = RealESRGAN(torch.device("cpu"), scale=4)
    model.load_weights("weights/RealESRGAN_x4.pth", download=True)
    report = []
    for slug, source in source_paths():
        with Image.open(source) as original:
            original_size = original.size
            white = Image.new("RGBA", original.size, "white")
            flattened = Image.alpha_composite(white, original.convert("RGBA")).convert("RGB")
        enhanced = model.predict(flattened)
        inference_size = enhanced.size
        scale = min(1, MAX_DIMENSION / max(enhanced.size))
        final_size = tuple(round(value * scale) for value in enhanced.size)
        if final_size != enhanced.size:
            enhanced = enhanced.resize(final_size, Image.Resampling.LANCZOS)
        output = OUTPUT / f"{slug}.webp"
        enhanced.convert("RGB").save(output, "WEBP", quality=WEBP_QUALITY, method=6)
        with Image.open(output) as verified:
            report.append({
                "slug": slug,
                "source": str(source.relative_to(ROOT)),
                "original_dimensions": original_size,
                "inference_dimensions": inference_size,
                "final_dimensions": verified.size,
                "format": verified.format,
                "output_bytes": output.stat().st_size,
                "quality_status": "needs_manual_review" if slug in MANUAL_REVIEW else "acceptable_for_production",
                "quality_note": "Opaque white background avoids alpha-edge mattes; review for model oversharpening.",
            })
    (OUTPUT / "report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
