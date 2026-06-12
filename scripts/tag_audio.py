#!/usr/bin/env python3
"""Embed canonical //H¥PE release metadata into the Hyperion Radio MP3s.

Reads src/data/radio.json (the release registry) and writes ID3v2.3 tags +
embedded cover art into each public/assets/radio/*.mp3, so files downloaded
from the site carry full metadata. Idempotent — safe to re-run after adding
tracks or editing the registry.

Usage:  python scripts/tag_audio.py        (from the repo root)
Needs:  pip install mutagen
"""
import json
import sys
from pathlib import Path

from mutagen.id3 import (ID3, APIC, COMM, TALB, TCOM, TCON, TCOP, TDRC,
                         TIT2, TPE1, TPE2, TPUB, TRCK, TXXX, ID3NoHeaderError)

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'src' / 'data' / 'radio.json'
PUBLIC = ROOT / 'public'

COPYRIGHT = '© 2026 Hyperion Industries LLC'
PUBLISHER = 'Hyperion Radio'
ENC = 3  # UTF-8


def tag(track: dict, total: int) -> str:
    audio_rel = (track.get('audio') or '').lstrip('/')
    if not audio_rel:
        return f"SKIP  {track.get('id')}: no audio file bound"
    mp3 = PUBLIC / audio_rel
    if not mp3.exists():
        return f"MISS  {track.get('id')}: {mp3} not found"

    try:
        tags = ID3(mp3)
    except ID3NoHeaderError:
        tags = ID3()

    tags.delall('APIC')
    tags.add(TIT2(encoding=ENC, text=track['title']))
    tags.add(TPE1(encoding=ENC, text=track.get('artist', 'H¥PE')))
    tags.add(TALB(encoding=ENC, text=track.get('album', 'Transmission 01')))
    tags.add(TPE2(encoding=ENC, text=track.get('albumArtist', 'H¥PE')))
    tags.add(TCOM(encoding=ENC, text=track.get('composer', 'Xero')))
    tags.add(TRCK(encoding=ENC, text=f"{track.get('trackNo', 0)}/{total}"))
    tags.add(TCON(encoding=ENC, text=track.get('genre', 'Electronic')))
    tags.add(TDRC(encoding=ENC, text=str(track.get('year', 2026))))
    tags.add(COMM(encoding=ENC, lang='eng', desc='', text=track.get('comment', '')))
    tags.add(TCOP(encoding=ENC, text=COPYRIGHT))
    tags.add(TPUB(encoding=ENC, text=PUBLISHER))
    tags.add(TXXX(encoding=ENC, desc='PRODUCER', text=track.get('producer', 'Kairo')))

    art_rel = (track.get('artStatic') or '').lstrip('/')
    art = PUBLIC / art_rel if art_rel else None
    if art and art.exists():
        mime = 'image/png' if art.suffix.lower() == '.png' else 'image/jpeg'
        tags.add(APIC(encoding=ENC, mime=mime, type=3, desc='Cover', data=art.read_bytes()))

    tags.save(mp3, v2_version=3)
    return f"OK    {track['trackNo']:>2}/{total}  {track['title']} — {track.get('artist')}"


def main() -> int:
    tracks = json.loads(REGISTRY.read_text(encoding='utf-8'))
    total = len(tracks)
    for t in tracks:
        print(tag(t, total))
    return 0


if __name__ == '__main__':
    sys.exit(main())
