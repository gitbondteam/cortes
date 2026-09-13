import json
import re
from pathlib import Path

import torch
from PIL import Image
from RealESRGAN import RealESRGAN

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "upscale-test"
SLUGS = ("corte-americano", "aranita", "tomahawk")
MAX_DIMENSION = 1600


def paths_from_catalog():
    source = (ROOT / "src/data/products.ts").read_text()
    entries = re.findall(r"slug: '([^']+)'[\s\S]*?image: '([^']+)'", source)
    return dict(entries)


def resize(image, size):
    return image.resize(size, Image.Resampling.LANCZOS)


def main():
    OUTPUT.mkdir(exist_ok=True)
    catalog = paths_from_catalog()
    model = RealESRGAN(torch.device("cpu"), scale=4)
    model.load_weights("weights/RealESRGAN_x4.pth", download=True)
    report = []

    for slug in SLUGS:
        source = ROOT / "public" / catalog[slug].lstrip("/")
        with Image.open(source) as original:
            alpha = original.getchannel("A") if "A" in original.getbands() else None
            original_size = original.size
            original_bytes = source.stat().st_size
            enhanced = model.predict(original.convert("RGB"))
            inference_size = enhanced.size
            scale = min(1, MAX_DIMENSION / max(enhanced.size))
            final_size = tuple(round(value * scale) for value in enhanced.size)
            if final_size != enhanced.size:
                enhanced = resize(enhanced, final_size)
            if alpha:
                alpha = resize(alpha, final_size)
                enhanced.putalpha(alpha)
            output = OUTPUT / f"{slug}.png"
            enhanced.save(output, "PNG")

        with Image.open(output) as verified:
            decoded = verified.load() is not None
            alpha_preserved = bool(alpha) == ("A" in verified.getbands())
            report.append({
                "slug": slug,
                "source": str(source.relative_to(ROOT)),
                "original_dimensions": original_size,
                "inference_dimensions": inference_size,
                "final_dimensions": verified.size,
                "original_bytes": original_bytes,
                "final_bytes": output.stat().st_size,
                "alpha_present": bool(alpha),
                "alpha_preserved": alpha_preserved,
                "decodes": decoded,
                "quality_check": "No alpha matte introduced; visual review required for halos and oversharpening.",
            })

    (OUTPUT / "report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
