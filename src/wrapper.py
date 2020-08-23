import os
import json
import uuid
import base64
import hashlib
import tempfile

import torch as th
from scipy.io import wavfile

from demucs.audio import AudioFile
from demucs.utils import apply_model, load_model


MODELS = {
    "demucs_extra.th": "3331bcc5d09ba1d791c3cf851970242b0bb229ce81dbada557b6d39e8c6a6a87"
}


class Demucs(object):
    def __init__(self, fpath, verify=False, load=True, mp3=True):
        model_fname = os.path.basename(fpath)

        self.device = "cuda" if th.cuda.is_available() else "cpu"
        self.shifts = 0
        self.split = True
        self.mp3 = mp3
        self.float32 = False
        self.verbose = False

        if verify:
            print("Verifying model")
            model_hash = MODELS.get(os.path.basename(model_fname))
            self.verify_file(fpath, model_hash)

        if load:
            self.model = load_model(fpath).to(self.device)

    def verify_file(self, target, file_hash):
        hasher = hashlib.sha256()

        with open(target, "rb") as f:
            while True:
                data = f.read(65536)
                if not data:
                    break
                hasher.update(data)

        signature = hasher.hexdigest()
        if signature != file_hash:
            raise Exception(
                f"Invalid sha256 signature for the file {target}. Expected {file_hash} but got {signature}"
            )

    def separate(self, track, output_dir):
        """
        Returns
        -------
            dictionary of {source_name: fname}
                fname is a file inside the output_dir argument
                e.g. {"bass": "bass.mp3", "drums": "drums.mp3"}
        """
        wav = (
            AudioFile(track)
            .read(streams=0, samplerate=44100, channels=2)
            .to(self.device)
        )
        # Round to nearest short integer for compatibility with how MusDB load audio with stempeg.
        wav = (wav * 2 ** 15).round() / 2 ** 15
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / ref.std()

        sources = apply_model(
            self.model, wav, shifts=self.shifts, split=self.split, progress=True
        )
        sources = sources * ref.std() + ref.mean()

        gen_files = {}
        source_names = ["drums", "bass", "other", "vocals"]
        os.makedirs(output_dir, exist_ok=True)

        for source_name, source in zip(source_names, sources):
            if self.mp3 or not self.float32:
                source = (source * 2 ** 15).clamp_(-(2 ** 15), 2 ** 15 - 1).short()
            source = source.cpu().transpose(0, 1).numpy()

            if self.mp3:
                out_name = f"{source_name}.mp3"
                local_file = os.path.join(output_dir, f"{source_name}.mp3")
                self.encode_mp3(source, local_file, verbose=self.verbose)
            else:
                out_name = f"{source_name}.wav"
                local_file = os.path.join(output_dir, f"{source_name}.wav")
                wavfile.write(local_file, 44100, source)

            gen_files[source_name] = out_name

        return gen_files

    def bytes_to_tmp_file(self, bytes_):
        fp = tempfile.NamedTemporaryFile()
        fp.write(bytes_)
        fp.flush()
        return fp

    def encode_mp3(self, wav, path, verbose=False):
        try:
            import lameenc
        except ImportError:
            raise Exception("Failed to call lame encoder. Maybe it is not installed? ")
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(320)
        encoder.set_in_sample_rate(44100)
        encoder.set_channels(2)
        encoder.set_quality(2)  # 2-highest, 7-fastest
        if not verbose:
            encoder.silence()
        mp3_data = encoder.encode(wav.tostring())
        mp3_data += encoder.flush()
        with open(path, "wb") as f:
            f.write(mp3_data)
