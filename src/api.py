import os
import sys
import uuid
import base64
import shutil
import hashlib
import zipfile
import tempfile

import requests
from Algorithmia.errors import AlgorithmException

# Add this directory to the PYTHONPATH to make demucs lib importable
this_dir = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_dir)

try:
    from . import algorithmia_utils
    from . import wrapper
except Exception:
    import algorithmia_utils
    import wrapper


class DemucsAPI(algorithmia_utils.BaseAPI):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        this_dir = os.path.dirname(os.path.realpath(__file__))
        self.output_dir = os.path.join(this_dir, "separated")

    def load_model(self):
        if algorithmia_utils.in_algorithmia:
            model_fpath = algorithmia_utils.get_file(
                "data://danielfrg/demucs/demucs_extra.th"
            )
        else:
            model_fpath = "models/demucs_extra.th"

        if algorithmia_utils.in_algorithmia:
            self.download_ffmpeg()

        return wrapper.Demucs(model_fpath)

    def download_ffmpeg(self):
        print("Downloading ffmpeg and ffprobe")

        import subprocess

        output_dir = (
            "/home/algo/.local/bin"
            if algorithmia_utils.in_algorithmia
            else "/Users/danielfrg/Downloads"
        )
        ffmpeg_url = "https://github.com/vot/ffbinaries-prebuilt/releases/download/v4.2.1/ffmpeg-4.2.1-linux-64.zip"
        ffprobe_url = "https://github.com/vot/ffbinaries-prebuilt/releases/download/v4.2.1/ffprobe-4.2.1-linux-64.zip"

        download_and_unzip(ffmpeg_url, output_dir=output_dir)
        download_and_unzip(ffprobe_url, output_dir=output_dir)

        subprocess.check_output(["chmod", "+x", os.path.join(output_dir, "ffmpeg")])
        subprocess.check_output(["chmod", "+x", os.path.join(output_dir, "ffprobe")])

    def debug_info(self):
        import subprocess
        import torch as th

        bin_dir = (
            "/home/algo/.local/bin"
            if algorithmia_utils.in_algorithmia
            else "/Users/danielfrg/Downloads"
        )

        return {
            "pytorch_device": "cuda" if th.cuda.is_available() else "cpu",
            "which_ffmpeg": shutil.which("ffmpeg"),
            "which_ffprobe": shutil.which("ffprobe"),
            "ls_bin": subprocess.check_output(["ls", "-la", bin_dir]).decode("utf-8"),
        }

    def cached(self, fpath):
        """
        Checks if this file has already been processed
        and if it has returns the same format as model.separate()

        Returns
        -------
            tuple of (unique_id, generated_files)
        """
        unique_id = hash_file(fpath)
        sources = ["bass", "drums", "other", "vocals"]
        source_exists = []
        output = {}

        for source in sources:
            output[source] = f"{source}.mp3"

            if algorithmia_utils.in_algorithmia:
                username = "danielfrg"
                collection = "demucs_output"
                file_exists = algorithmia_utils.exists(
                    username=username,
                    collection=collection,
                    fname=f"{unique_id}-{source}.mp3",
                )
                source_exists.append(file_exists)
            else:
                fpath = f"./separated/{unique_id}/{source}.mp3"
                source_exists.append(os.path.exists(fpath))

        if not all(source_exists):
            output = None

        return unique_id, output

    def predict(self, predict):
        if "fpath" in predict:
            fpath = predict["fpath"]
        elif "base64" in predict:
            tempfile_ = base64_to_file(predict["base64"])
            fpath = tempfile_.name
        else:
            raise AlgorithmException("Invalid input json format")

        unique_id, generated_files = self.cached(fpath)
        output_dir = os.path.join(self.output_dir, unique_id)
        print(unique_id, generated_files)
        if not generated_files:
            os.makedirs(output_dir, exist_ok=True)
            generated_files = self.model.separate(fpath, output_dir=output_dir)

        for source_name, file in generated_files.items():
            if algorithmia_utils.in_algorithmia:
                fname = os.path.basename(file)
                key = f"{unique_id}-{fname}"

                algorithmia_utils.upload_file(
                    file, username="danielfrg", collection="demucs_output", fname=key
                )
                generated_files[source_name] = key
            else:
                generated_files[source_name] = os.path.join(output_dir, file)

        generated_files["id"] = unique_id
        return generated_files


def hash_file(target):
    hasher = hashlib.sha256()

    with open(target, "rb") as f:
        while True:
            data = f.read(65536)
            if not data:
                break
            hasher.update(data)

    signature = hasher.hexdigest()
    return signature


def base64_to_file(base64str):
    """
    Takes a base64 enconded file and saves it to a temp file
    Returns the NamedTemporaryFile object
    """
    decoded = base64.decodebytes(bytearray(base64str, "utf8"))
    fp = tempfile.NamedTemporaryFile()
    fp.write(decoded)
    fp.flush()
    return fp


def download_and_unzip(url, output_dir=None):
    local_filename = url.split("/")[-1]
    with requests.get(url, stream=True) as r:
        r.raise_for_status()

        fpath = local_filename
        if output_dir:
            fpath = os.path.join(output_dir, local_filename)

        with open(fpath, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                # If you have chunk encoded response uncomment if
                # and set chunk_size parameter to None.
                # if chunk:
                f.write(chunk)

    with zipfile.ZipFile(fpath, "r") as zip_ref:
        zip_ref.extractall(output_dir)

    return fpath
