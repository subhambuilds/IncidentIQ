"""
Entry point to run the FastAPI backend.
"""

import os
import sys
import subprocess

try:
    import uvicorn
except ModuleNotFoundError:
    # If launched using a different Python executable (e.g. MSYS2/WindowsApps),
    # automatically re-launch using the Python 3.13 installation where dependencies are installed.
    py313 = os.path.expanduser(r"~\AppData\Local\Programs\Python\Python313\python.exe")
    if os.path.exists(py313):
        res = subprocess.run([py313] + sys.argv)
        sys.exit(res.returncode)
    try:
        res = subprocess.run(["py", "-3.13"] + sys.argv)
        sys.exit(res.returncode)
    except Exception:
        raise

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)

