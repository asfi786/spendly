"""Generate Spendly PWA icons: emerald gradient rounded-square + white S-sprout mark."""
from PIL import Image, ImageDraw
import math, os

OUT = os.path.expanduser('~/workspace/spendly/public/icons')
os.makedirs(OUT, exist_ok=True)

TOP = (52, 211, 153)     # #34d399
BOT = (5, 150, 105)      # #059669

def gradient(size, r_frac=0.28, full_bleed=False):
    """Vertical gradient rounded square. full_bleed: no rounded corners (for maskable)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if full_bleed:
        for y in range(size):
            t = y / (size - 1)
            d.line([(0, y), (size, y)], fill=tuple(int(TOP[i] + (BOT[i] - TOP[i]) * t) for i in range(3)))
    else:
        mask = Image.new('L', (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * r_frac), fill=255)
        grad = Image.new('RGB', (size, size))
        dg = ImageDraw.Draw(grad)
        for y in range(size):
            t = y / (size - 1)
            dg.line([(0, y), (size, y)], fill=tuple(int(TOP[i] + (BOT[i] - TOP[i]) * t) for i in range(3)))
        img.paste(grad, (0, 0), mask)
    return img

def cubic(p0, p1, p2, p3, n=40):
    pts = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        x = mt**3*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t**3*p3[0]
        y = mt**3*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t**3*p3[1]
        pts.append((x, y))
    return pts

def draw_mark(img, scale_box):
    """Draw white S + sprout leaves, mapped from the 48x48 Logo viewBox into scale_box=(x,y,w)."""
    x0, y0, w = scale_box
    s = w / 48.0
    d = ImageDraw.Draw(img)
    def X(px): return x0 + px * s
    def Y(py): return y0 + py * s

    # S path from Logo.tsx (cubic segments, relative control points)
    pts48 = []
    start = (31.5, 16.5)
    segs = [
        ((-3.5, -2.6), (-10.5, -2.3), (-11, 2.4)),
        ((-0.5, 5.4), (8.5, 4.7), (8.2, 10.2)),
        ((-0.3, 5.7), (-8, 6.2), (-12, 3.6)),
    ]
    p = start
    for (c1, c2, e) in segs:
        q0 = p
        q1 = (p[0] + c1[0], p[1] + c1[1])
        q2 = (p[0] + c2[0], p[1] + c2[1])
        q3 = (p[0] + e[0], p[1] + e[1])
        pts48 += cubic(q0, q1, q2, q3)
        p = q3
    pts = [(X(x), Y(y)) for x, y in pts48]
    sw = 5.4 * s
    d.line(pts, fill=(255, 255, 255, 255), width=int(sw), joint='curve')
    for px, py in (pts[0], pts[-1]):
        d.ellipse([px - sw/2, py - sw/2, px + sw/2, py + sw/2], fill=(255, 255, 255, 255))

    # Sprout leaves near top of the S
    leaf1 = [(30.5, 15.8), (41.5, 9.0)]   # bounding box of leaf 1
    leaf2 = [(27.5, 16.8), (31.0, 6.5)]   # bounding box of leaf 2
    for (x1, y1), (x2, y2), col in [
        (leaf1[0], leaf1[1], (209, 250, 229, 255)),
        (leaf2[0], leaf2[1], (167, 243, 208, 255)),
    ]:
        d.ellipse([X(min(x1, x2)), Y(min(y1, y2)), X(max(x1, x2)), Y(max(y1, y2))], fill=col)

def make(size, name, full_bleed=False):
    img = gradient(size, full_bleed=full_bleed)
    if full_bleed:
        # maskable: full-bleed background, mark at 80% centered
        inset = size * 0.10
        draw_mark(img, (inset, inset, size - 2 * inset))
    else:
        draw_mark(img, (0, 0, size))
    img.save(os.path.join(OUT, name), 'PNG')
    print('wrote', name, img.size)

make(192, 'icon-192.png')
make(512, 'icon-512.png')
make(512, 'maskable-512.png', full_bleed=True)
make(180, 'apple-touch-icon.png')
