#!/usr/bin/env python3
"""Download the studio's photographs from Google Drive and size them for the web.

Run this on your own machine. The Drive connector used to build this site
caps out somewhere between 4 MB and 9.8 MB per file, and the originals are
10-32 MB, so the remaining placeholders could not be filled from there.

Setup (once):

    pip install google-api-python-client google-auth-oauthlib Pillow
    # Create an OAuth client ID (Desktop app) at console.cloud.google.com,
    # enable the Drive API, download the JSON, save it as credentials.json

Then:

    python3 tools/fetch_from_drive.py --folder 1d-Ugskfk-zGRnmFHw-1SaEi_GQOPv9of
    python3 build.py

It downloads every image in the folder, writes web-sized JPEGs into
assets/img/incoming/, and prints a contact sheet so you can pick which goes
where. Nothing on the live site changes until you move files out of incoming/.
"""

import argparse
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "incoming")
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# The slots the site still needs, so you know what to aim for.
SLOTS = """
  hero-02 hero-03            landscape, 2400px  - hero alternates
  wedding-01 .. wedding-06   mixed              - wedding grid + depth gallery
  engagement-01 .. -03       mixed              - couples
  portrait-01 .. portrait-04 mostly portrait    - headshots, maternity, grad
  commercial-01 .. -03       mixed              - brand and product
  about-01 about-02          portrait/landscape - the studio at work
  team-01 team-02 team-03    portrait 4:5       - the people
  journal-02 journal-03      landscape 16:10    - journal headers
"""


def build_service():
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
    except ImportError:
        sys.exit("Missing deps. Run:\n"
                 "  pip install google-api-python-client google-auth-oauthlib Pillow")

    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if not os.path.exists("credentials.json"):
            sys.exit("credentials.json not found - see the header of this file.")
        flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
        creds = flow.run_local_server(port=0)
        with open("token.json", "w") as fh:
            fh.write(creds.to_json())
    return build("drive", "v3", credentials=creds)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--folder", required=True, help="Drive folder ID")
    ap.add_argument("--long-edge", type=int, default=2000)
    ap.add_argument("--quality", type=int, default=82)
    ap.add_argument("--limit", type=int, default=0, help="stop after N images")
    args = ap.parse_args()

    from googleapiclient.http import MediaIoBaseDownload
    from PIL import Image, ImageOps

    service = build_service()
    os.makedirs(OUT, exist_ok=True)

    files, token = [], None
    while True:
        resp = service.files().list(
            q="'%s' in parents and mimeType contains 'image/' and trashed = false" % args.folder,
            fields="nextPageToken, files(id, name, size, mimeType)",
            pageSize=200, pageToken=token).execute()
        files += resp.get("files", [])
        token = resp.get("nextPageToken")
        if not token:
            break

    if args.limit:
        files = files[:args.limit]
    print("Found %d images.\n" % len(files))

    done = 0
    for f in files:
        stem = os.path.splitext(f["name"])[0]
        dest = os.path.join(OUT, stem + ".jpg")
        if os.path.exists(dest):
            print("  skip      %s (already downloaded)" % stem)
            continue
        try:
            buf = io.BytesIO()
            dl = MediaIoBaseDownload(buf, service.files().get_media(fileId=f["id"]))
            while True:
                _, complete = dl.next_chunk()
                if complete:
                    break
            buf.seek(0)
            im = ImageOps.exif_transpose(Image.open(buf)).convert("RGB")
            before = im.size
            im.thumbnail((args.long_edge, args.long_edge), Image.LANCZOS)
            im.save(dest, "JPEG", quality=args.quality, optimize=True, progressive=True)
            print("  saved     %-28s %sx%s -> %sx%s  %.0f KB"
                  % (stem + ".jpg", before[0], before[1], im.size[0], im.size[1],
                     os.path.getsize(dest) / 1024))
            done += 1
        except Exception as exc:
            print("  FAILED    %-28s %s" % (stem, exc))

    print("\n%d images written to assets/img/incoming/" % done)
    print("\nSlots still needing a photograph:%s" % SLOTS)
    print("Move a file into assets/img/ named for its slot, point the reference\n"
          "at .jpg instead of .svg in src/, write real alt text, then run build.py.")


if __name__ == "__main__":
    main()
