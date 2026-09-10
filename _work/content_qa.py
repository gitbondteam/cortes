"""Content QA for the built site. Run from the project root after `npm run build`."""

import glob
import os
import re

EXPECTED = [
    "Arañita", "Bife de Chorizo", "Bife de Cuadril", "Bife de Nalga", "Bife de Peceto",
    "Bife de Picaña", "Bocado Ancho", "Chorizo", "Colita de Cuadril", "Corte Americano",
    "Corte del Rey", "Corte para Tacos", "Costilla", "Costilla Banderita", "Costilla Ventana",
    "Entraña", "Flat Iron", "Lomo", "Matambre", "Matambre de Cerdo", "Molida Especial",
    "Morcilla", "Ojo de Bife", "Osobuco", "Peceto", "Picaña", "Ponchito de Cerdo",
    "Punta de Espalda", "Salame", "Tapa de Asado", "T-Bone", "Tomahawk", "Vacío",
]

fails = []


def check(ok, label, detail=""):
    if not ok:
        fails.append(label)
    print(f"[{'x' if ok else ' '}] {label}{('  → ' + detail) if detail else ''}")


src = open("src/data/products.ts", encoding="utf-8").read()
names = re.findall(r"^\s*name: '(.+?)',", src, re.M)
slugs = re.findall(r"^\s*slug: '(.+?)',", src, re.M)
imgs = re.findall(r"^\s*image: '(.+?)',", src, re.M)
prices = re.findall(r"^\s*price: (\d+),", src, re.M)
html = "".join(open(p, encoding="utf-8").read() for p in glob.glob("dist/**/*.html", recursive=True))

print("── Catalogue data")
check(len(names) == 33, "33 products in the data source", str(len(names)))
missing = [e for e in EXPECTED if e not in names]
extra = [n for n in names if n not in EXPECTED]
check(not missing and not extra, "all 33 expected product names present",
      f"missing={missing} unexpected={extra}" if (missing or extra) else "")
check(len(set(slugs)) == 33, "every slug unique", str(len(set(slugs))))
check(all(re.fullmatch(r"[a-z0-9-]+", s) for s in slugs), "slugs are URL-safe ASCII")
check(len(prices) == 33, "33 prices stored for later use", str(len(prices)))

print("\n── Assets")
missing_img = [i for i in imgs if not os.path.exists("public" + i)]
check(not missing_img, "every product image file exists", str(missing_img))
files = {os.path.basename(f) for f in glob.glob("public/products/*.webp")}
refs = {os.path.basename(i) for i in imgs}
check(files == refs, "no orphan or duplicate product images", str(sorted(files ^ refs)))
check(html.count("/brand/logo-") > 0, "brand logo asset used",
      f"{html.count('/brand/logo-')} references")
check(">CORTES ARGENTINOS<" not in html.upper().replace(" ", " "),
      "logo is not recreated as plain text")

print("\n── Routes")
pages = sorted(os.path.basename(os.path.dirname(p)) for p in glob.glob("dist/catalogo/*/index.html"))
check(sorted(slugs) == pages, "33 product detail routes built", str(len(pages)))
for path in ["dist/index.html", "dist/catalogo/index.html", "dist/nosotros/index.html",
             "dist/contacto/index.html", "dist/404.html", "dist/robots.txt",
             "dist/sitemap-index.xml"]:
    check(os.path.exists(path), f"{path} exists")

print("\n── Prices hidden by default")
leaked = sorted(set(re.findall(r"\$\s?\d{2}\.\d{3}", html)))
check(not leaked, "no price string anywhere in the HTML", str(leaked))
check('card__price"' not in html, "no price markup on catalogue cards")
check('specs__price"' not in html, "no price row on product pages")
check('"offers"' not in html, "no Offer node in JSON-LD")

print("\n── Not an ecommerce site")
for term in ["carrito", "checkout", "add-to-cart", "shopping-cart", "comprar ahora",
             "finalizar compra", "medios de pago"]:
    check(term.lower() not in html.lower(), f"no {term!r}")

print("\n── Business facts")
numbers = set(re.findall(r"wa\.me/(\d+)", html))
check(numbers == {"5493525414150"}, "one correct WhatsApp number", str(numbers))
check(set(re.findall(r"tel:\+(\d+)", html)) == {"5493525414150"}, "click-to-call correct")
check("Salta 633" in html and "Jesús María" in html and "Córdoba" in html, "address correct")
check("@cortesargentinos.arg" in html, "Instagram handle correct")
check('lang="es-AR"' in html, "lang is es-AR")

print("\n── No invented content")
check("lorem" not in html.lower() and "ipsum" not in html.lower(), "no lorem ipsum")

# Visible copy only — the search field's `placeholder` attribute and the
# `::placeholder` CSS rule are legitimate and must not trip this.
visible = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
visible = re.sub(r"<[^>]+>", " ", visible)
check("placeholder" not in visible.lower(), "no placeholder text in visible copy")
check("TODO" not in visible and "FIXME" not in visible, "no TODO/FIXME left in copy")
check("Producto de ejemplo" not in html, "no placeholder products")
for claim, label in [
    ("facebook.com", "no invented Facebook URL"),
    ("delivery", "no delivery claim"),
    ("descargá la app", "no app-download claim"),
    ("años de experiencia", "no years-in-business claim"),
    ("certificad", "no certification claim"),
    ("angus", "no cattle-breed claim"),
    ("envíos a todo", "no shipping-coverage claim"),
    ("horario", "no opening-hours claim"),
    ("geo\"", "no invented coordinates"),
    ("postalCode", "no invented postal code"),
    ("priceRange", "no invented price range"),
    ("aggregateRating", "no invented ratings"),
]:
    check(claim.lower() not in html.lower(), label)

print("\n" + ("ALL CHECKS PASSED" if not fails else f"{len(fails)} FAILED: {fails}"))
raise SystemExit(1 if fails else 0)
