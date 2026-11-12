#!/usr/bin/env python3
"""Offline line-art vectorizer and enclosed coloring-region extractor for Game #65.

Reads the 8 official 1024x1024 black-on-white Smiling Critters PNGs under
assets/lineart/*_line_art.png and generates src/lineart_data.js containing:
  - 6 ordered step-by-step drawing stroke groups per critter (true skeleton
    centerlines in 800x640 canvas coordinates, simplified & merged so lessons
    have a sensible 6..12 strokes per critter at 28 px/s teacher pacing).
  - 7 ordered coloring-step region polygon sets per critter (exact Euclidean
    Voronoi region tessellation to ink centerlines, encoded for Canvas 2D
    'evenodd' clipping & real area coverage with zero halo gaps).
  - Crisp eye-sclera polygons, pupil catchlight coordinates, and pole-of-
    inaccessibility target centers for each coloring step.
"""

import json
import math
import os
import cv2
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.measure import approximate_polygon
from skimage.morphology import skeletonize

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINEART_DIR = os.path.join(REPO_ROOT, 'assets', 'lineart')
OUT_JS_PATH = os.path.join(REPO_ROOT, 'src', 'lineart_data.js')

CANVAS_W = 800
CANVAS_H = 640

CRITTER_CONFIGS = [
    {
        'id': 'catnap',
        'file': 'catnap_line_art.png',
        'anat': {
            'head': [3],
            'ears': [7, 8],
            'inner_ears': [18, 19],
            'sclera': [15, 16],
            'pupil': [20, 21],
            'nose': [24],
            'mouth': [2],
            'tongue': [17],
            'pendant': [14],
            'collar': [22],
            'tail': [1],
            'belly': [10],
            'pads': [6, 12],
            'limbs': [4, 5, 9, 11, 13],
            'bg_holes': [23],
        },
        'color_groups': {
            'main_fur': [1, 3, 4, 5, 7, 8, 9, 11, 13],
            'inner_ears_muzzle': [6, 12, 18, 19],
            'tummy_collar': [10, 22],
            'cheeks_mouth': [17, 24],
            'magic_pendant': [14],
            'shading_sparkles': [2, 20, 21],
        },
    },
    {
        'id': 'dogday',
        'file': 'dogday_line_art.png',
        'anat': {
            'head': [23, 10, 28, 37],
            'ears': [1, 3],
            'inner_ears': [],
            'sclera': [24, 25],
            'pupil': [29, 30],
            'nose': [31],
            'mouth': [2],
            'tongue': [16],
            'pendant': [17, 19, 41],
            'collar': [32, 34, 35, 38, 40],
            'tail': [6],
            'belly': [15],
            'pads': [12, 14, 26, 27, 36, 39],
            'limbs': [4, 5, 7, 8, 9, 11, 13, 18, 20, 21, 22],
            'bg_holes': [33],
        },
        'color_groups': {
            'main_fur': [23, 4, 6, 8, 9, 11, 13, 5, 7, 18, 20, 21, 22],
            'inner_ears_muzzle': [1, 3, 10, 28, 37],
            'tummy_collar': [15, 12, 14, 26, 27, 36, 39, 32, 34, 35, 38, 40],
            'cheeks_mouth': [16],
            'magic_pendant': [17, 19, 41],
            'shading_sparkles': [2, 29, 30, 31],
        },
    },
    {
        'id': 'bobby',
        'file': 'bobby_bearhug_line_art.png',
        'anat': {
            'head': [2],
            'ears': [10, 12],
            'inner_ears': [18, 19],
            'sclera': [14, 16],
            'pupil': [22, 23],
            'nose': [24],
            'mouth': [3],
            'tongue': [17],
            'pendant': [15],
            'collar': [21],
            'tail': [13],
            'belly': [4],
            'pads': [7, 8],
            'limbs': [1, 5, 6, 9, 11, 20],
            'bg_holes': [25],
        },
        'color_groups': {
            'main_fur': [1, 2, 5, 6, 9, 10, 11, 12, 13, 20],
            'inner_ears_muzzle': [7, 8, 18, 19],
            'tummy_collar': [4, 21],
            'cheeks_mouth': [17, 24],
            'magic_pendant': [15],
            'shading_sparkles': [3, 22, 23],
        },
    },
    {
        'id': 'bubba',
        'file': 'bubba_bubbaphant_line_art.png',
        'anat': {
            'head': [1, 33],
            'ears': [5],
            'inner_ears': [3, 11],
            'sclera': [20, 23],
            'pupil': [26, 27],
            'nose': [9, 25],
            'mouth': [8, 18],
            'tongue': [24],
            'pendant': [19, 28, 31, 32],
            'collar': [29],
            'tail': [12, 16, 21],
            'belly': [],
            'pads': [6, 10, 14, 15, 22],
            'limbs': [2, 4, 7, 13],
            'bg_holes': [17, 30],
        },
        'color_groups': {
            'main_fur': [1, 2, 4, 5, 7, 9, 13, 16, 21, 33],
            'inner_ears_muzzle': [3, 11, 22, 25],
            'tummy_collar': [6, 10, 14, 15, 29, 12],
            'cheeks_mouth': [24],
            'magic_pendant': [19, 28, 31, 32],
            'shading_sparkles': [8, 18, 26, 27],
        },
    },
    {
        'id': 'craftycorn',
        'file': 'craftycorn_line_art.png',
        'anat': {
            'head': [2],
            'ears': [3, 14, 20, 22, 24, 28, 35],
            'inner_ears': [23],
            'sclera': [12, 21],
            'pupil': [26, 27],
            'nose': [],
            'mouth': [7],
            'tongue': [17],
            'pendant': [29, 30, 31, 32, 33, 34],
            'collar': [36, 37],
            'tail': [1, 4, 11, 16],
            'belly': [5],
            'pads': [9, 10, 15, 18, 19],
            'limbs': [6, 8, 13, 25],
            'bg_holes': [],
        },
        'color_groups': {
            'main_fur': [2, 5, 6, 8, 13, 25, 35],
            'inner_ears_muzzle': [3, 14, 20, 1, 4],
            'tummy_collar': [9, 10, 15, 18, 19, 11, 16, 23, 36, 37],
            'cheeks_mouth': [17, 22, 24, 28],
            'magic_pendant': [29, 30, 31, 32, 33, 34],
            'shading_sparkles': [7, 26, 27],
        },
    },
    {
        'id': 'hoppy',
        'file': 'hoppy_hopscotch_line_art.png',
        'anat': {
            'head': [2],
            'ears': [4, 5, 10, 14, 26],
            'inner_ears': [19],
            'sclera': [18, 20],
            'pupil': [25, 27],
            'nose': [31],
            'mouth': [3],
            'tongue': [21],
            'pendant': [24],
            'collar': [35],
            'tail': [8],
            'belly': [],
            'pads': [11, 13, 17, 28, 30, 32],
            'limbs': [1, 6, 7, 9, 12, 15, 16, 22, 23, 29, 34],
            'bg_holes': [33],
        },
        'color_groups': {
            'main_fur': [2, 10, 14, 26, 1, 7, 9, 12, 15, 16, 22, 23, 29, 34],
            'inner_ears_muzzle': [4, 5, 8, 6, 11],
            'tummy_collar': [19, 13, 17, 28, 30, 32, 35],
            'cheeks_mouth': [21, 31],
            'magic_pendant': [24],
            'shading_sparkles': [3, 25, 27],
        },
    },
    {
        'id': 'kickin',
        'file': 'kickin_chicken_line_art.png',
        'anat': {
            'head': [4],
            'ears': [2, 11],
            'inner_ears': [],
            'sclera': [8, 9],
            'pupil': [18, 19],
            'nose': [13],
            'mouth': [3],
            'tongue': [16],
            'pendant': [12],
            'collar': [22],
            'tail': [5],
            'belly': [],
            'pads': [6, 7, 14, 15],
            'limbs': [1, 10, 17, 20],
            'bg_holes': [21],
        },
        'color_groups': {
            'main_fur': [4, 2, 1, 10, 17, 20, 5],
            'inner_ears_muzzle': [13, 6, 7, 14, 15],
            'tummy_collar': [11, 22],
            'cheeks_mouth': [16],
            'magic_pendant': [12],
            'shading_sparkles': [3, 18, 19],
        },
    },
    {
        'id': 'pickypiggy',
        'file': 'picky_piggy_line_art.png',
        'anat': {
            'head': [2],
            'ears': [5, 7],
            'inner_ears': [30, 32],
            'sclera': [15, 20],
            'pupil': [27, 29],
            'nose': [18, 35, 36],
            'mouth': [1],
            'tongue': [19],
            'pendant': [10, 33, 34],
            'collar': [26],
            'tail': [21, 22, 25],
            'belly': [12, 28],
            'pads': [3, 6, 8, 9, 14, 17],
            'limbs': [4, 11, 13, 16, 24],
            'bg_holes': [23, 31],
        },
        'color_groups': {
            'main_fur': [2, 5, 7, 4, 11, 13, 16, 24, 21, 22, 25],
            'inner_ears_muzzle': [18, 30, 32, 12, 28, 26],
            'tummy_collar': [3, 6, 8, 9, 14, 17],
            'cheeks_mouth': [19, 35, 36],
            'magic_pendant': [10, 33, 34],
            'shading_sparkles': [1, 27, 29],
        },
    },
]


def mask_to_canvas_rings(mask_bool, to_canvas, eps_img=1.65):
    """Extract boundary contours of mask_bool for exact Canvas 2D 'evenodd' paths."""
    padded = np.pad(mask_bool.astype(np.uint8), 1, mode='constant', constant_values=0)
    contours, _ = cv2.findContours(padded * 255, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    rings = []
    for cnt in contours:
        if len(cnt) < 4 or cv2.contourArea(cnt) < 8.0:
            continue
        pts = cnt[:, 0, :].astype(float) - 1.0
        if len(pts) >= 6:
            pts = 0.2 * np.roll(pts, 1, axis=0) + 0.6 * pts + 0.2 * np.roll(pts, -1, axis=0)
        approx = cv2.approxPolyDP(pts.astype(np.float32), eps_img, True)[:, 0, :]
        if len(approx) < 3:
            continue
        c_ring = [
            [round(float(to_canvas(p[0], p[1])[0]), 1), round(float(to_canvas(p[0], p[1])[1]), 1)]
            for p in approx
        ]
        rings.append(c_ring)
    return rings


def pole_of_inaccessibility(mask_bool, to_canvas):
    dist = ndimage.distance_transform_edt(mask_bool)
    if dist.max() <= 0:
        return [400.0, 320.0]
    my, mx = np.unravel_index(np.argmax(dist), dist.shape)
    cx, cy = to_canvas(float(mx), float(my))
    return [round(float(cx), 1), round(float(cy), 1)]


def merge_step_edges_local(sedges, max_hop=48.0):
    if not sedges:
        return []
    unused = []
    for e in sedges:
        pts = e['pts_canvas']
        arc = sum(
            math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])
            for k in range(1, len(pts))
        )
        unused.append({'pts': pts, 'arc': arc, 'is_loop': e['is_loop']})

    chains = []
    used = [False] * len(unused)
    order = sorted(range(len(unused)), key=lambda i: -unused[i]['arc'])
    for seed in order:
        if used[seed]:
            continue
        used[seed] = True
        pts = list(unused[seed]['pts'])
        if not unused[seed]['is_loop']:
            if pts[-1][1] + 15 < pts[0][1] or (
                abs(pts[-1][1] - pts[0][1]) <= 15 and pts[-1][0] < pts[0][0]
            ):
                pts = list(reversed(pts))

        changed = True
        while changed:
            changed = False
            best_j, best_mode, best_arc = None, None, -1
            for j in order:
                if used[j] or unused[j]['is_loop']:
                    continue
                q = unused[j]['pts']
                if math.hypot(pts[-1][0] - q[0][0], pts[-1][1] - q[0][1]) <= 2.5:
                    if unused[j]['arc'] > best_arc:
                        best_j, best_mode, best_arc = j, 'end_fwd', unused[j]['arc']
                elif math.hypot(pts[-1][0] - q[-1][0], pts[-1][1] - q[-1][1]) <= 2.5:
                    if unused[j]['arc'] > best_arc:
                        best_j, best_mode, best_arc = j, 'end_rev', unused[j]['arc']
            if best_j is not None:
                used[best_j] = True
                q = unused[best_j]['pts']
                if best_mode == 'end_rev':
                    q = list(reversed(q))
                pts.extend(q[1:])
                changed = True

        changed = True
        while changed:
            changed = False
            best_j, best_mode, best_arc = None, None, -1
            for j in order:
                if used[j] or unused[j]['is_loop']:
                    continue
                q = unused[j]['pts']
                if math.hypot(pts[0][0] - q[-1][0], pts[0][1] - q[-1][1]) <= 2.5:
                    if unused[j]['arc'] > best_arc:
                        best_j, best_mode, best_arc = j, 'pre_fwd', unused[j]['arc']
                elif math.hypot(pts[0][0] - q[0][0], pts[0][1] - q[0][1]) <= 2.5:
                    if unused[j]['arc'] > best_arc:
                        best_j, best_mode, best_arc = j, 'pre_rev', unused[j]['arc']
            if best_j is not None:
                used[best_j] = True
                q = unused[best_j]['pts']
                if best_mode == 'pre_rev':
                    q = list(reversed(q))
                pts = q[:-1] + pts
                changed = True

        if math.hypot(pts[0][0] - pts[-1][0], pts[0][1] - pts[-1][1]) > 4.0:
            if pts[-1][1] + 24 < pts[0][1] or (
                abs(pts[-1][1] - pts[0][1]) <= 24 and pts[-1][0] < pts[0][0]
            ):
                pts = list(reversed(pts))
        arc = sum(
            math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])
            for k in range(1, len(pts))
        )
        chains.append({'pts': pts, 'arc': arc})

    c_used = [False] * len(chains)
    c_order = sorted(range(len(chains)), key=lambda i: -chains[i]['arc'])
    compound_strokes = []

    for seed in c_order:
        if c_used[seed]:
            continue
        c_used[seed] = True
        comp_pts = [list(p) for p in chains[seed]['pts']]
        comp_arc = chains[seed]['arc']

        while True:
            tip = comp_pts[-1]
            best_k, best_rev, best_idx, best_score = None, False, -1, 1e9
            for k in range(len(chains)):
                if c_used[k]:
                    continue
                q = chains[k]['pts']
                q_arc = chains[k]['arc']
                is_closed_q = math.hypot(q[0][0] - q[-1][0], q[0][1] - q[-1][1]) < 3.0
                for rev in (False, True):
                    if rev and is_closed_q:
                        continue
                    qs = q[-1] if rev else q[0]
                    qe = q[0] if rev else q[-1]
                    # Option A: append at current tip if within max_hop
                    d_tip = math.hypot(tip[0] - qs[0], tip[1] - qs[1])
                    tip_lim = max_hop if q_arc >= 45.0 else 64.0
                    if d_tip <= tip_lim and d_tip < best_score:
                        best_score = d_tip
                        best_k, best_rev, best_idx = k, rev, len(comp_pts) - 1
                    # Option B: splice at an interior vertex of comp_pts ONLY if both entry & return hops <= 64px!
                    if is_closed_q or q_arc <= 85.0:
                        for vi, vp in enumerate(comp_pts[:-1]):
                            d_in = math.hypot(vp[0] - qs[0], vp[1] - qs[1])
                            if d_in > 56.0:
                                continue
                            d_out = math.hypot(qe[0] - vp[0], qe[1] - vp[1])
                            if d_out <= 64.0:
                                sc = max(d_in, d_out) + 6.0
                                if sc < best_score:
                                    best_score = sc
                                    best_k, best_rev, best_idx = k, rev, vi
            if best_k is None:
                break
            c_used[best_k] = True
            q = chains[best_k]['pts']
            if best_rev:
                q = list(reversed(q))
            if best_idx == len(comp_pts) - 1:
                if math.hypot(comp_pts[-1][0] - q[0][0], comp_pts[-1][1] - q[0][1]) <= 2.0:
                    comp_pts.extend([list(p) for p in q[1:]])
                else:
                    comp_pts.append([q[0][0], q[0][1], 1])
                    comp_pts.extend([list(p) for p in q[1:]])
            else:
                anchor = [comp_pts[best_idx][0], comp_pts[best_idx][1]]
                ins = []
                if math.hypot(anchor[0] - q[0][0], anchor[1] - q[0][1]) <= 2.0:
                    ins.extend([list(p) for p in q[1:]])
                else:
                    ins.append([q[0][0], q[0][1], 1])
                    ins.extend([list(p) for p in q[1:]])
                ins.append([anchor[0], anchor[1], 1])
                comp_pts = comp_pts[: best_idx + 1] + ins + comp_pts[best_idx + 1 :]
            comp_arc += chains[best_k]['arc']

        compound_strokes.append({'pts': comp_pts, 'arc': comp_arc})

    # Order major shapes (>= 45% of largest stroke in step) left-to-right, before smaller secondary strokes!
    max_step_arc = max((s['arc'] for s in compound_strokes), default=1.0)
    compound_strokes.sort(
        key=lambda s: (
            0 if s['arc'] >= 0.45 * max_step_arc else 1,
            round(s['pts'][0][0] / 140.0) if s['arc'] >= 0.45 * max_step_arc else -s['arc'],
            s['pts'][0][1],
        )
    )
    return [s['pts'] for s in compound_strokes]


def process_critter(spec):
    cid = spec['id']
    im = Image.open(os.path.join(LINEART_DIR, spec['file'])).convert('L')
    gray = np.array(im, dtype=float)
    smooth_gray = ndimage.gaussian_filter(gray, sigma=0.75)
    ink = smooth_gray < 182

    white = gray >= 180
    w_lbl, n_w = ndimage.label(white)
    bg_raw = int(w_lbl[0, 0])

    reg_counts = []
    for r in range(1, n_w + 1):
        if r == bg_raw:
            continue
        cnt = int(np.sum(w_lbl == r))
        if cnt >= 10:
            reg_counts.append((cnt, r))
        else:
            w_lbl[w_lbl == r] = 0
    reg_counts.sort(reverse=True)
    r_idx_to_raw = {k: raw for k, (_, raw) in enumerate(reg_counts, 1)}
    raw_to_r_idx = {raw: k for k, raw in r_idx_to_raw.items()}
    raw_to_r_idx[bg_raw] = 0

    r_idx_to_tag = {0: 'bg'}
    for tag, idxs in spec['anat'].items():
        for idx in idxs:
            r_idx_to_tag[idx] = tag
    for idx in spec['anat'].get('bg_holes', []):
        r_idx_to_tag[idx] = 'bg_hole'

    cg_all = []
    for v in spec['color_groups'].values():
        cg_all.extend(v)
    cg_all.extend(spec['anat']['sclera'])
    cg_all.extend(spec['anat']['bg_holes'])
    assert set(cg_all) == set(range(1, len(reg_counts) + 1)), f'{cid} region mismatch'
    assert len(cg_all) == len(set(cg_all)), f'{cid} duplicate region'

    _, nearest_idx = ndimage.distance_transform_edt(w_lbl == 0, return_indices=True)
    vor_raw = w_lbl[nearest_idx[0], nearest_idx[1]]

    ys_ink, xs_ink = np.where(ink)
    x0, x1 = float(xs_ink.min()), float(xs_ink.max())
    y0, y1 = float(ys_ink.min()), float(ys_ink.max())
    mid_x = 0.5 * (x0 + x1)
    mid_y = 0.5 * (y0 + y1)
    scale = min(580.0 / (x1 - x0), 540.0 / (y1 - y0), 0.625)

    def to_canvas(px, py):
        return (400.0 + (px - mid_x) * scale, 322.0 + (py - mid_y) * scale)

    dist_ink = ndimage.distance_transform_edt(ink)
    skel = skeletonize(ink)
    med_stroke_w = float(np.median(dist_ink[skel]) * 2.0 * scale)

    H, W = skel.shape
    skel_pts = np.argwhere(skel)
    pt_set = set((int(x), int(y)) for y, x in skel_pts)

    def neighbors8(x, y):
        out = []
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = x + dx, y + dy
                if (nx, ny) in pt_set:
                    if dx != 0 and dy != 0:
                        if (x + dx, y) in pt_set or (x, y + dy) in pt_set:
                            continue
                    out.append((nx, ny))
        return out

    adj = {p: neighbors8(p[0], p[1]) for p in pt_set}
    junc_pixels = {p for p, nbs in adj.items() if len(nbs) >= 3}

    junc_id_of = {}
    junc_centers = {}
    visited_j = set()
    jid = 0
    for jp in junc_pixels:
        if jp in visited_j:
            continue
        jid += 1
        comp = []
        stack = [jp]
        visited_j.add(jp)
        while stack:
            cur = stack.pop()
            comp.append(cur)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nb = (cur[0] + dx, cur[1] + dy)
                    if nb in junc_pixels and nb not in visited_j:
                        visited_j.add(nb)
                        stack.append(nb)
        for p in comp:
            junc_id_of[p] = jid
        junc_centers[jid] = (
            sum(p[0] for p in comp) / len(comp),
            sum(p[1] for p in comp) / len(comp),
        )

    non_junc = pt_set - junc_pixels
    visited_chain_px = set()
    raw_edges = []

    for p in non_junc:
        if p in visited_chain_px:
            continue
        nbs = adj[p]
        non_j_nbs = [nb for nb in nbs if nb in non_junc]
        j_nbs = [nb for nb in nbs if nb in junc_pixels]
        if len(non_j_nbs) <= 1:
            chain = [p]
            visited_chain_px.add(p)
            start_j = junc_id_of[j_nbs[0]] if j_nbs else None
            cur = p
            prev = None
            end_j = None
            while True:
                cur_nbs = adj[cur]
                nxt_non_j = [
                    nb for nb in cur_nbs
                    if nb in non_junc and nb != prev and nb not in visited_chain_px
                ]
                if nxt_non_j:
                    prev = cur
                    cur = nxt_non_j[0]
                    chain.append(cur)
                    visited_chain_px.add(cur)
                else:
                    end_j_cands = [junc_id_of[nb] for nb in cur_nbs if nb in junc_pixels]
                    if len(chain) == 1 and start_j is not None:
                        other = [j for j in end_j_cands if j != start_j]
                        end_j = other[0] if other else None
                    elif end_j_cands:
                        end_j = end_j_cands[0]
                    break
            pts_img = []
            if start_j is not None:
                pts_img.append(junc_centers[start_j])
            pts_img.extend([(float(x), float(y)) for x, y in chain])
            if end_j is not None:
                pts_img.append(junc_centers[end_j])
            raw_edges.append({'pts_img': pts_img, 'u': start_j, 'v': end_j, 'is_loop': False})

    for p in non_junc:
        if p in visited_chain_px:
            continue
        chain = [p]
        visited_chain_px.add(p)
        cur = p
        while True:
            nxt = [nb for nb in adj[cur] if nb in non_junc and nb not in visited_chain_px]
            if not nxt:
                break
            cur = nxt[0]
            chain.append(cur)
            visited_chain_px.add(cur)
        pts_img = [(float(x), float(y)) for x, y in chain]
        pts_img.append(pts_img[0])
        raw_edges.append({'pts_img': pts_img, 'u': None, 'v': None, 'is_loop': True})

    seen_j_pairs = set()
    for jp in junc_pixels:
        ju = junc_id_of[jp]
        for nb in adj[jp]:
            if nb in junc_pixels:
                jv = junc_id_of[nb]
                if ju != jv:
                    pair = (min(ju, jv), max(ju, jv))
                    if pair not in seen_j_pairs:
                        seen_j_pairs.add(pair)
                        raw_edges.append({
                            'pts_img': [junc_centers[ju], junc_centers[jv]],
                            'u': ju,
                            'v': jv,
                            'is_loop': False,
                        })

    filtered_edges = []
    for e in raw_edges:
        pts = e['pts_img']
        arc_img = sum(
            math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
            for i in range(1, len(pts))
        )
        is_spur = (e['u'] is not None and e['v'] is None) or (e['u'] is None and e['v'] is not None)
        if is_spur and arc_img < 9.5:
            continue
        if arc_img < 2.0:
            continue
        e['arc_img'] = arc_img
        filtered_edges.append(e)

    for e in filtered_edges:
        pts = e['pts_img']
        n = len(pts)
        tag_votes = {}
        ridx_votes = {}
        lo_i = max(0, int(n * 0.15))
        hi_i = min(n - 1, max(lo_i, int(math.ceil(n * 0.85)) - 1))
        idxs = np.linspace(lo_i, hi_i, min(max(1, hi_i - lo_i + 1), 15), dtype=int)
        for k in idxs:
            k0 = max(0, k - 1)
            k1 = min(n - 1, k + 1)
            tx = pts[k1][0] - pts[k0][0]
            ty = pts[k1][1] - pts[k0][1]
            tlen = math.hypot(tx, ty)
            if tlen < 1e-4:
                continue
            nx, ny = -ty / tlen, tx / tlen
            for side in (-7.5, 7.5):
                sx = int(round(np.clip(pts[k][0] + nx * side, 0, W - 1)))
                sy = int(round(np.clip(pts[k][1] + ny * side, 0, H - 1)))
                r_idx = raw_to_r_idx.get(int(vor_raw[sy, sx]), 0)
                t = r_idx_to_tag.get(r_idx, 'bg')
                tag_votes[t] = tag_votes.get(t, 0) + 1
                ridx_votes[r_idx] = ridx_votes.get(r_idx, 0) + 1

        total_v = max(1, sum(tag_votes.values()))
        adj_tags = {t for t, c in tag_votes.items() if c / total_v >= 0.15}
        adj_ridxs = {r for r, c in ridx_votes.items() if c / total_v >= 0.15}

        mx = sum(p[0] for p in pts) / n
        my = sum(p[1] for p in pts) / n

        if cid == 'bubba':
            if 1 in adj_ridxs and mx < 405 and (
                'bg' in adj_tags or 'inner_ears' in adj_tags or adj_ridxs <= {1}
            ):
                adj_tags.add('ears')
            if my < 225 and ('bg' in adj_tags and 'head' in adj_tags and e['arc_img'] < 130):
                adj_tags.add('ears')
        if cid == 'craftycorn' and 2 in adj_ridxs:
            if my < 252 and mx > 425 and ('bg' in adj_tags or 'inner_ears' in adj_tags):
                adj_tags.add('ears')
            if e['is_loop'] and e['arc_img'] < 85 and 330 < my < 425 and 290 < mx < 400:
                adj_tags.add('nose')

        if 'pupil' in adj_tags or 'sclera' in adj_tags or 'nose' in adj_tags:
            if cid == 'craftycorn' and 'ears' in adj_tags and 'sclera' in adj_tags and my < 305:
                step = 1
            else:
                step = 2
        elif 'tongue' in adj_tags or 'mouth' in adj_tags:
            step = 3
        elif 'ears' in adj_tags or 'inner_ears' in adj_tags:
            step = 1
        elif adj_tags <= {'bg', 'head'} and my < 240 and e['u'] is None and e['v'] is None:
            step = 1
        elif 'head' in adj_tags:
            step = 0
        elif 'pendant' in adj_tags or 'collar' in adj_tags or 'tail' in adj_tags:
            step = 5
        elif cid == 'pickypiggy' and (
            31 in adj_ridxs
            or 23 in adj_ridxs
            or (adj_tags <= {'bg', 'bg_hole'} and mx < 260 and my > 480)
        ):
            step = 5
        else:
            step = 4
        e['step'] = step

        cpts = np.array([to_canvas(px, py) for px, py in pts], dtype=float)
        if e['is_loop'] and len(cpts) >= 6:
            body = cpts[:-1]
            top_i = int(np.argmin(body[:, 1]))
            body = np.roll(body, -top_i, axis=0)
            for _ in range(2):
                body = 0.25 * np.roll(body, 1, axis=0) + 0.5 * body + 0.25 * np.roll(body, -1, axis=0)
            cpts = np.vstack([body, body[0]])
        elif len(cpts) >= 4:
            for _ in range(2):
                nxt = cpts.copy()
                nxt[1:-1] = 0.25 * cpts[:-2] + 0.5 * cpts[1:-1] + 0.25 * cpts[2:]
                cpts = nxt
        simp = approximate_polygon(cpts, tolerance=0.65)
        if len(simp) < 2:
            simp = cpts[[0, -1]]
        e['pts_canvas'] = [[round(float(x), 1), round(float(y), 1)] for x, y in simp]

    step_strokes = []
    for s in range(6):
        sedges = [e for e in filtered_edges if e['step'] == s]
        hop = 72.0 if (cid == 'bubba' and s == 0) else 48.0
        strokes = merge_step_edges_local(sedges, max_hop=hop)
        step_strokes.append(strokes)

    regions_out = {}
    targets_out = {}
    for part_id, r_idxs in spec['color_groups'].items():
        raw_ids = [r_idx_to_raw[i] for i in r_idxs]
        mask = np.isin(vor_raw, raw_ids)
        regions_out[part_id] = mask_to_canvas_rings(mask, to_canvas, eps_img=1.65)
        targets_out[part_id] = pole_of_inaccessibility(mask, to_canvas)

    sclera_raw = [r_idx_to_raw[i] for i in spec['anat']['sclera']]
    sclera_mask = np.isin(vor_raw, sclera_raw)
    eye_white_rings = mask_to_canvas_rings(sclera_mask, to_canvas, eps_img=1.45)

    catchlights = []
    for p_idx in spec['anat']['pupil']:
        pmask = w_lbl == r_idx_to_raw[p_idx]
        ys_p, xs_p = np.where(pmask)
        if len(xs_p) > 0:
            px_c = float(np.percentile(xs_p, 35))
            py_c = float(np.percentile(ys_p, 30))
            cx, cy = to_canvas(px_c, py_c)
            catchlights.append([round(float(cx), 1), round(float(cy), 1), 4.6])
            px_s = float(np.percentile(xs_p, 68))
            py_s = float(np.percentile(ys_p, 72))
            sx, sy = to_canvas(px_s, py_s)
            catchlights.append([round(float(sx), 1), round(float(sy), 1), 2.4])

    bg_holes_raw = [r_idx_to_raw[i] for i in spec['anat']['bg_holes']]
    critter_solid_mask = (vor_raw != bg_raw) & (~np.isin(vor_raw, bg_holes_raw))
    critter_holes_for_bg = mask_to_canvas_rings(critter_solid_mask, to_canvas, eps_img=1.85)
    outer_ring = [[20.0, 20.0], [780.0, 20.0], [780.0, 620.0], [20.0, 620.0]]
    regions_out['background_frame'] = [outer_ring] + critter_holes_for_bg
    targets_out['background_frame'] = [115.0, 125.0]

    return {
        'strokeWidth': round(float(max(5.6, min(6.5, med_stroke_w))), 1),
        'stepStrokes': step_strokes,
        'regions': regions_out,
        'targets': targets_out,
        'eyeWhites': eye_white_rings,
        'catchlights': catchlights,
    }


def main():
    data = {}
    print('Extracting 8 Smiling Critters line-art lessons...')
    for spec in CRITTER_CONFIGS:
        cid = spec['id']
        res = process_critter(spec)
        data[cid] = res
        n_strokes = sum(len(st) for st in res['stepStrokes'])
        step_counts = [len(st) for st in res['stepStrokes']]
        total_arc = 0.0
        total_demo = 0.0
        for st in res['stepStrokes']:
            for pts in st:
                arc = sum(
                    math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
                    for i in range(1, len(pts))
                    if len(pts[i]) < 3 or not pts[i][2]
                )
                total_arc += arc
                total_demo += 1.0 + max(3.5, arc / 28.0)
        print(
            f'  {cid:12s}: {n_strokes:2d} strokes {step_counts} | '
            f'arc={total_arc:5.0f}px | passive_demo={total_demo:5.1f}s'
        )

    js_payload = (
        '// Generated offline by tools/extract_lineart.py from assets/lineart/*_line_art.png\n'
        '// Canvas coordinate system: 800 x 640.\n'
        'export const LINEART_DATA = '
        + json.dumps(data, separators=(',', ':'))
        + ';\n'
    )
    os.makedirs(os.path.dirname(OUT_JS_PATH), exist_ok=True)
    with open(OUT_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(js_payload)
    print(f'Wrote {OUT_JS_PATH} ({len(js_payload) / 1024:.1f} KB)')


if __name__ == '__main__':
    main()
