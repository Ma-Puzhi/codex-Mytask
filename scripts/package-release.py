"""Package tracked source and a licensed extension; exclude deployment state."""
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent.parent
version = (root / "VERSION").read_text().strip()
if not re.fullmatch(r"\d+\.\d+\.\d+", version):
    raise ValueError("VERSION must contain a release version")
if subprocess.check_output(["git", "status", "--porcelain"], cwd=root).strip():
    raise RuntimeError("Commit or stash source changes before packaging a release")
subprocess.run(["python3", str(root / "scripts/package-companion.py")], cwd=root, check=True)
destination = root / "dist/releases"
destination.mkdir(parents=True, exist_ok=True)
source = destination / f"MyTask-v{version}-source.zip"
files = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode().split("\0")
with ZipFile(source, "w") as archive:
    for name in sorted(filter(None, files)):
        path = root / name
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"Expected a regular tracked file: {name}")
        if name in [".openai/hosting.json", ".mytask/config.json"] or name.startswith((".env", ".dev.vars", ".wrangler/", "node_modules/")):
            raise ValueError(f"Deployment state must not be tracked: {name}")
        info = ZipInfo(f"MyTask-v{version}/" + name, date_time=(2026, 10, 9, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = (0o100755 if name.endswith(".sh") else 0o100644) << 16
        archive.writestr(info, path.read_bytes())
extension = destination / f"MyTasks_Chat_Bridge-v{version}.zip"
shutil.copyfile(root / "public/downloads/MyTasks_Chat_Bridge.zip", extension)
artifacts = [source, extension]
(destination / "SHA256SUMS").write_text("".join(f"{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n" for p in artifacts))
print(json.dumps({"version": version, "source_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root).decode().strip(), "artifacts": [str(p) for p in artifacts]}, indent=2))
