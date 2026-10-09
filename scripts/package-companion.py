"""Generate an extension archive for the configured MyTask site."""
import json
import subprocess
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
configuration = root / ".mytask/config.json"
origin = json.loads(configuration.read_text())["siteOrigin"] if configuration.exists() else "http://localhost:5173"
subprocess.run(["node", str(root / "scripts/configure-site.mjs"), "--origin", origin], cwd=root, check=True)
destination = root / "public/downloads/MyTasks_Chat_Bridge.zip"
destination.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(destination, "w") as archive:
    for name in ("manifest.json", "background.js", "shared.js", "site.js", "chat.js", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md"):
        info = ZipInfo("MyTasks_Chat_Bridge/" + name, date_time=(2026, 10, 9, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, (root / "dist/companion" / name).read_bytes())
print(destination)
