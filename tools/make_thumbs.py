#!/usr/bin/env python3
"""Rebuild the friend-picker thumbnails in assets/thumbs/ from assets/lineart/.

    python3 tools/make_thumbs.py [size]        # default size: 400 (pixels, square)

For each <name>_line_art.png this writes assets/thumbs/<name>.png:
  * outside of the critter -> transparent
  * inside of the critter  -> white (the page tints it once the friend is finished)
  * lines                  -> warm ink brown, slightly thickened so they read at small sizes
The files are 8-bit indexed PNGs with alpha (about 12 KB each at 400 px).

Needs: Google Chrome (headless is used as the image engine) and `pip install websockets`.
Nothing is fetched from the network; a throwaway local server only serves this folder.
"""
import asyncio
import base64
import functools
import glob
import http.server
import json
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import zlib

import websockets

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = int(sys.argv[1]) if len(sys.argv) > 1 else 400
INK = (74, 52, 38)  # same brown as --ink in src/ui.css
LEVELS = 16
CHROME = os.environ.get('CHROME', shutil.which('google-chrome') or shutil.which('chromium') or 'google-chrome')

EXTRACT_JS = r"""
(async (url, SIZE, INK) => {
  const img = new Image();
  img.src = url;
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight, N = W * H;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff';
  g.fillRect(0, 0, W, H);
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, W, H);
  const d = id.data;
  let dark = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    dark[i] = 1 - (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
  }
  // Thicken the lines a little (separable max filter keeps the soft edges).
  const R = Math.round((W / 1024) * 3);
  const tmp = new Float32Array(N), dil = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 0;
    for (let k = Math.max(0, x - R); k <= Math.min(W - 1, x + R); k++) m = Math.max(m, dark[y * W + k]);
    tmp[y * W + x] = m;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 0;
    for (let k = Math.max(0, y - R); k <= Math.min(H - 1, y + R); k++) m = Math.max(m, tmp[k * W + x]);
    dil[y * W + x] = m;
  }
  dark = dil;
  // Flood the outside from the border through light pixels.
  const outside = new Uint8Array(N), stack = new Int32Array(N);
  let sp = 0;
  const push = (i) => { if (!outside[i] && dark[i] < 0.5) { outside[i] = 1; stack[sp++] = i; } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (sp > 0) {
    const i = stack[--sp], x = i % W, y = (i - x) / W;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let i = 0; i < N; i++) {
    const k = Math.min(1, Math.max(0, dark[i]));
    if (outside[i]) {
      d[i * 4] = INK[0]; d[i * 4 + 1] = INK[1]; d[i * 4 + 2] = INK[2];
      d[i * 4 + 3] = Math.round(255 * Math.min(1, k * 2));
    } else {
      for (let ch = 0; ch < 3; ch++) d[i * 4 + ch] = Math.round(255 + (INK[ch] - 255) * k);
      d[i * 4 + 3] = 255;
      const x = i % W, y = (i - x) / W;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  g.putImageData(id, 0, 0);
  // Square crop around the critter, then a two-step downscale for clean edges.
  const side = Math.round(Math.max(maxX - minX + 1, maxY - minY + 1) * 1.06);
  const sx = Math.round((minX + maxX) / 2 - side / 2), sy = Math.round((minY + maxY) / 2 - side / 2);
  const scale = (src, sx0, sy0, s0, size) => {
    const o = document.createElement('canvas');
    o.width = size; o.height = size;
    const og = o.getContext('2d');
    og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
    og.drawImage(src, sx0, sy0, s0, s0, 0, 0, size, size);
    return o;
  };
  const out = scale(scale(c, sx, sy, side, SIZE * 2), 0, 0, SIZE * 2, SIZE);
  const od = out.getContext('2d').getImageData(0, 0, SIZE, SIZE).data;
  let bin = '';
  for (let i = 0; i < od.length; i += 8192) bin += String.fromCharCode.apply(null, od.subarray(i, i + 8192));
  return btoa(bin);
})
"""


def write_indexed_png(path, rgba, size):
    """Palette: 0..15 opaque white->ink ramp, 16..31 ink with rising alpha (16 = transparent)."""
    palette, alphas = [], []
    for i in range(LEVELS):
        k = i / (LEVELS - 1)
        palette.append(tuple(round(255 + (ch - 255) * k) for ch in INK))
        alphas.append(255)
    for i in range(LEVELS):
        palette.append(INK)
        alphas.append(round(255 * i / (LEVELS - 1)))
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            o = (y * size + x) * 4
            r, a = rgba[o], rgba[o + 3]
            if a >= 250:
                rows.append(max(0, min(LEVELS - 1, round((255 - r) / (255 - INK[0]) * (LEVELS - 1)))))
            else:
                rows.append(LEVELS + max(0, min(LEVELS - 1, round(a / 255 * (LEVELS - 1)))))

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 3, 0, 0, 0))
    png += chunk(b'PLTE', b''.join(bytes(p) for p in palette))
    png += chunk(b'tRNS', bytes(alphas))
    png += chunk(b'IDAT', zlib.compress(bytes(rows), 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as fh:
        fh.write(png)
    return len(png)


async def run(port, debug_port):
    with urllib.request.urlopen(urllib.request.Request(f'http://127.0.0.1:{debug_port}/json/new?about:blank', method='PUT')) as r:
        target = json.load(r)
    async with websockets.connect(target['webSocketDebuggerUrl'], max_size=None, ping_interval=None) as ws:
        counter = 0

        async def call(method, params):
            nonlocal counter
            counter += 1
            await ws.send(json.dumps({'id': counter, 'method': method, 'params': params}))
            while True:
                msg = json.loads(await ws.recv())
                if msg.get('id') == counter:
                    if 'error' in msg:
                        raise RuntimeError(msg['error'])
                    return msg['result']

        base = f'http://127.0.0.1:{port}/'
        await call('Page.navigate', {'url': base + 'README.md'})
        await asyncio.sleep(1.0)
        out_dir = os.path.join(REPO, 'assets', 'thumbs')
        os.makedirs(out_dir, exist_ok=True)
        for src in sorted(glob.glob(os.path.join(REPO, 'assets', 'lineart', '*_line_art.png'))):
            stem = os.path.basename(src)[: -len('_line_art.png')]
            expr = f'({EXTRACT_JS})({json.dumps(base + "assets/lineart/" + os.path.basename(src))}, {SIZE}, {list(INK)})'
            res = await call('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})
            if 'exceptionDetails' in res:
                raise RuntimeError(res['exceptionDetails'])
            rgba = base64.b64decode(res['result']['value'])
            n = write_indexed_png(os.path.join(out_dir, f'{stem}.png'), rgba, SIZE)
            print(f'{stem}.png  {n} bytes')


def main():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=REPO))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = tempfile.mkdtemp(prefix='thumbs_chrome_')
    debug_port = 9400 + os.getpid() % 500
    chrome = subprocess.Popen(
        [
            CHROME, '--headless=new', f'--remote-debugging-port={debug_port}', f'--user-data-dir={profile}',
            # Without this, Chrome on Linux can wait forever for the system keyring before its first request.
            '--password-store=basic', '--use-mock-keychain',
            '--no-first-run', '--disable-gpu', '--mute-audio', 'about:blank',
        ],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(80):
            time.sleep(0.25)
            try:
                urllib.request.urlopen(f'http://127.0.0.1:{debug_port}/json/version', timeout=1).read()
                break
            except Exception:
                continue
        asyncio.run(run(server.server_address[1], debug_port))
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=10)
        except Exception:
            chrome.kill()
        server.shutdown()
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == '__main__':
    main()
