"""Build web-ready brand assets from the source PDFs.

Run from the project root:  python3 _work/build_assets.py
Inputs:  _work/extract/*, _work/products/*, _work/brand/*
Outputs: public/brand, public/products, public/images
"""

import json
import os
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = os.path.join(ROOT, "_work")
PUB = os.path.join(ROOT, "public")


def out(*parts):
    p = os.path.join(PUB, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


# --------------------------------------------------------------------------
# 1. Seamless charcoal texture tile
# --------------------------------------------------------------------------
def make_texture():
    src = Image.open(os.path.join(W, "extract", "cat-texture-451.png")).convert("L")
    # A clean mid-frame crop, away from the vignette at the edges.
    crop = src.crop((700, 300, 2300, 1300)).resize((820, 820), Image.LANCZOS)

    a = np.asarray(crop, dtype=np.float32)
    # High-pass: drop the large-scale lighting so tiles can't be spotted.
    low = np.asarray(crop.filter(ImageFilter.GaussianBlur(28)), dtype=np.float32)
    hp = a - low

    # Cross-fade opposite edges so the tile wraps.
    feather = 90
    n = hp.shape[0]
    ramp = np.linspace(0.0, 1.0, feather, dtype=np.float32)
    hp[:, :feather] = hp[:, n - feather:] * (1 - ramp)[None, :] + hp[:, :feather] * ramp[None, :]
    hp = hp[:, : n - feather]
    m = hp.shape[0]
    hp[:feather, :] = hp[m - feather:, :] * (1 - ramp)[:, None] + hp[:feather, :] * ramp[:, None]
    hp = hp[: m - feather, :]

    # Normalise the grain to a controlled contrast.
    hp = hp / (hp.std() + 1e-6)
    hp = np.clip(hp, -3.0, 3.0) / 3.0

    size, max_alpha, levels = 448, 118, 16
    grey = Image.fromarray(np.clip(128 + hp * 127, 0, 255).astype(np.uint8)).resize(
        (size, size), Image.LANCZOS
    )
    v = np.asarray(grey, dtype=np.float32)

    # Bake the tile as black-with-alpha so it composites straight onto whatever
    # background-color the element has — no blend mode, no extra element.
    darkness = np.clip((128.0 - v) / 128.0, 0, 1)
    step = 255 / levels  # quantised: the alpha plane compresses far better
    alpha = (np.round(darkness * max_alpha / step) * step).astype(np.uint8)

    rgba = np.zeros((size, size, 4), np.uint8)
    rgba[..., 3] = alpha
    dest = out("images", "texture.webp")
    Image.fromarray(rgba, "RGBA").save(dest, "WEBP", quality=70, method=6, exact=True)
    print(f"texture.webp {size}x{size} {os.path.getsize(dest)/1024:.1f} KB")


# --------------------------------------------------------------------------
# 2. Product cut-outs -> trimmed, padded, transparent WebP
# --------------------------------------------------------------------------
def white_to_alpha(im: Image.Image) -> Image.Image:
    """Flood-fill the white studio background from the borders."""
    rgb = im.convert("RGB")
    mask = Image.new("L", rgb.size, 0)
    seeds = [(0, 0), (rgb.width - 1, 0), (0, rgb.height - 1), (rgb.width - 1, rgb.height - 1)]
    work = rgb.copy()
    for s in seeds:
        ImageDraw.floodfill(work, s, (255, 0, 255), thresh=26)
    arr = np.asarray(work)
    hit = (arr[:, :, 0] == 255) & (arr[:, :, 1] == 0) & (arr[:, :, 2] == 255)
    mask = Image.fromarray(np.where(hit, 0, 255).astype(np.uint8), "L")
    mask = mask.filter(ImageFilter.GaussianBlur(0.6))
    rgba = rgb.convert("RGBA")
    rgba.putalpha(mask)
    return rgba


def build_products():
    recs = json.load(open(os.path.join(W, "products.json")))
    manifest = {}
    for r in recs:
        im = Image.open(os.path.join(ROOT, r["src"]))
        if im.mode != "RGBA":
            im = white_to_alpha(im)
        else:
            im = im.convert("RGBA")

        bbox = im.getbbox()
        if bbox:
            im = im.crop(bbox)

        # Square canvas with a consistent 2% breathing margin.
        side = max(im.size)
        canvas_side = int(side * 1.04)
        canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
        canvas.alpha_composite(im, ((canvas_side - im.width) // 2, (canvas_side - im.height) // 2))

        # Normalise every cut-out to one intrinsic size so cards never shift.
        final = canvas.resize((420, 420), Image.LANCZOS)
        dest = out("products", f"{r['slug']}.webp")
        final.save(dest, "WEBP", quality=86, method=6)
        manifest[r["slug"]] = os.path.getsize(dest)

    total = sum(manifest.values())
    print(f"products: {len(manifest)} files, {total/1024:.0f} KB total, "
          f"largest {max(manifest.values())/1024:.0f} KB")


# --------------------------------------------------------------------------
# 3. Editorial photography
# --------------------------------------------------------------------------
PHOTOS = [
    # (source, output, target width, crop box on the source or None)
    ("br-photo-p5.png", "hero-steak", 1600, None),
    ("br-photo-p2.png", "somos-corte", 1400, None),
    ("br-photo-p4.png", "vitrina", 1400, None),
    ("br-photo-p6.png", "local", 1400, None),
    ("br-photo-p3-meat.png", "tabla", 1200, None),
]


def build_photos():
    for src, name, width, box in PHOTOS:
        im = Image.open(os.path.join(W, "extract", src))
        if box:
            im = im.crop(box)
        has_alpha = im.mode == "RGBA"
        im = im.convert("RGBA" if has_alpha else "RGB")
        # The hero is the only above-the-fold photo, so it gets the tightest
        # quality budget of the set.
        quality = 68 if name == "hero-steak" else (80 if has_alpha else 76)
        for w in (width, width // 2):
            r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            suffix = "" if w == width else "@small"
            dest = out("images", f"{name}{suffix}.webp")
            r.save(dest, "WEBP", quality=quality, method=6)
            print(f"  {name}{suffix}.webp {r.size} {os.path.getsize(dest)/1024:.0f} KB")


# --------------------------------------------------------------------------
# 4. Logos, favicon, OpenGraph card
# --------------------------------------------------------------------------
def build_brand():
    for f in ("logo-light.svg", "logo-red.svg", "logo-dark.svg"):
        shutil.copy(os.path.join(W, "brand", f), out("brand", f))
    print("logos copied")


def build_og():
    """Compose the OpenGraph card from the real texture + real logo."""
    import fitz

    ow, oh = 1200, 630
    tex = Image.open(os.path.join(W, "extract", "cat-texture-451.png")).convert("RGB")
    scale = max(ow / tex.width, oh / tex.height)
    tex = tex.resize((round(tex.width * scale), round(tex.height * scale)), Image.LANCZOS)
    left = (tex.width - ow) // 2
    top = (tex.height - oh) // 2
    card = tex.crop((left, top, left + ow, top + oh)).convert("RGBA")

    # Darken slightly so the logo carries.
    card.alpha_composite(Image.new("RGBA", (ow, oh), (10, 10, 10, 70)))

    doc = fitz.open(os.path.join(W, "brand", "logo-light.svg"))
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(3.2, 3.2), alpha=True)
    logo = Image.open(__import__("io").BytesIO(pix.tobytes("png"))).convert("RGBA")
    lw = 660
    logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    card.alpha_composite(logo, ((ow - lw) // 2, (oh - logo.height) // 2 - 14))

    # Red rule under the lockup, echoing the brochure.
    d = ImageDraw.Draw(card)
    cy = (oh + logo.height) // 2 + 44
    d.rectangle([ow // 2 - 60, cy, ow // 2 + 60, cy + 5], fill=(196, 31, 35, 255))

    card.convert("RGB").save(
        out("images", "og.jpg"), "JPEG", quality=76, optimize=True, progressive=True
    )
    print(f"og.jpg {os.path.getsize(out('images', 'og.jpg'))/1024:.0f} KB")


def build_favicon():
    """Monogram favicon: the 'CA' bar mark in brand red on charcoal."""
    import fitz

    doc = fitz.open(os.path.join(W, "brand", "logo-light.svg"))
    for size in (32, 180, 512):
        s = size * 4
        pix = doc[0].get_pixmap(matrix=fitz.Matrix(s / 325.14, s / 325.14), alpha=True)
        logo = Image.open(__import__("io").BytesIO(pix.tobytes("png"))).convert("RGBA")
        # Crop to the 'CORTES' word so it stays legible at 32px.
        logo = logo.crop((0, 0, logo.width, int(logo.height * 0.56)))
        canvas = Image.new("RGBA", (s, s), (20, 20, 20, 255))
        lw = int(s * 0.84)
        logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
        canvas.alpha_composite(logo, ((s - lw) // 2, (s - logo.height) // 2))
        canvas = canvas.resize((size, size), Image.LANCZOS)
        if size == 32:
            canvas.save(out("favicon", "favicon.ico"), sizes=[(32, 32)])
            canvas.save(out("favicon", "favicon-32.png"))
        elif size == 180:
            canvas.save(out("favicon", "apple-touch-icon.png"))
        else:
            canvas.save(out("favicon", "icon-512.png"))
    print("favicons built")


if __name__ == "__main__":
    make_texture()
    build_products()
    build_photos()
    build_brand()
    build_og()
    build_favicon()
