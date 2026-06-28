#!/usr/bin/env python3
"""Generate square favicons for Google Search site icon requirements."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "assets" / "aionex-logo.png"
OUT_DIRS = [ROOT / "assets", ROOT / "ionos-deploy" / "assets"]
BG = (5, 7, 8)


def build_square_logo(size: int) -> Image.Image:
    logo = Image.open(LOGO).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), BG + (255,))
    max_w = int(size * 0.82)
    max_h = int(size * 0.28)
    logo.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    canvas.paste(logo, (x, y), logo)
    return canvas


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(path, format="PNG", optimize=True)


def main() -> None:
    sizes = {
        "favicon-48.png": 48,
        "favicon-192.png": 192,
        "apple-touch-icon.png": 180,
        "favicon-512.png": 512,
    }
    icons = {name: build_square_logo(px) for name, px in sizes.items()}

    for out_dir in OUT_DIRS:
        for name, img in icons.items():
            save_png(img, out_dir / name)

    favicon_ico = ROOT / "favicon.ico"
    favicon_ico_ionos = ROOT / "ionos-deploy" / "favicon.ico"
    icons["favicon-48.png"].save(
        favicon_ico,
        format="ICO",
        sizes=[(48, 48), (32, 32), (16, 16)],
    )
    favicon_ico_ionos.write_bytes(favicon_ico.read_bytes())

    print("Generated square favicons in assets/ and ionos-deploy/assets/")
    print("Generated favicon.ico in project root and ionos-deploy/")


if __name__ == "__main__":
    main()
