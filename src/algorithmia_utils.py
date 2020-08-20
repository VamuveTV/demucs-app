import os
import sys
import shutil
import getpass
import subprocess

import Algorithmia
from Algorithmia.errors import AlgorithmException

algo_client = Algorithmia.client()
in_algorithmia = True if os.environ.get("ALGORITHMIA_API", False) else False


class BaseAPI(object):
    def __init__(self):
        self._model = None

    def get_model(self):
        """Singleton for the model
        """
        if self._model is None:
            print("BaseAPI: Loading model")
            self._model = self.load_model()
        return self._model

    model = property(get_model)

    def load_model(self):
        raise NotImplementedError

    def apply(self, input):
        if isinstance(input, dict):
            if "ping" in input.keys():
                return True
            elif "debug" in input.keys():
                return self.debug_info_all()
            elif "health" in input.keys():
                status = "live"
                if self._model:
                    status = "model_loaded"
                return {"status": status}
            elif "load" in input.keys():
                self.get_model()
                return "ok"
            elif "predict" in input.keys():
                self.get_model()
                return self.predict(input["predict"])
            else:
                raise AlgorithmException("Invalid input JSON format")
        else:
            raise AlgorithmException("Input should be JSON")

    def debug_info_all(self):
        data = {}

        data["env"] = dict(os.environ)
        data["sys_prefix"] = sys.prefix
        data["in_algorithmia"] = in_algorithmia
        data["pip_freeze"] = subprocess.check_output(["pip", "freeze"]).decode("utf-8")
        data["which_python"] = shutil.which("python")
        data["whoami"] = getpass.getuser()

        data.update(self.debug_info())

        return data

    def debug_info(self, input):
        raise {}

    def predict(self, input):
        raise NotImplementedError


def extract_file(file, output_dir="models"):
    """
    Extract a .tar.gz file that is downloaded by Algorithmia client

    Files downloaded by the Algoritmia client don't have an extension and are
    located undere /tmp e.g.: /tmp/tmpsva98zf4

    Files are extracted to ./models
    """
    # Make models dir for the original code
    this_path = os.path.dirname(os.path.realpath(__file__))
    output_dir = os.path.join(this_path, "models")
    os.mkdir(output_dir)

    try:
        output = subprocess.check_output(
            "tar -C {output} -xzf {targz}".format(output=output_dir, targz=file),
            stderr=subprocess.STDOUT,
            shell=True,
        ).decode()
        success = True
    except subprocess.CalledProcessError as ex:
        output = ex.output.decode()
        raise Exception("Could not extract model: %s" % ex)

    return success


def get_file(fname, target_name=None):
    """
    Download a file hosted on Algorithmia Hosted Data

    If the file ends with .tar.gz it will untar the file.
    """
    target_name = target_name if target_name is not None else fname

    if fname.startswith("data://"):
        # Download from Algoritmia hosted data
        fname = algo_client.file(fname).getFile().name
        target_name = fname

        if fname.endswith(".tar.gz"):
            target_name = os.path.basename(fname)[:-7]
            extract_file(fname)

    return target_name


def upload_file(
    local_filename,
    fname,
    connector="data",
    username="danielfrg",
    collection="demucs_output",
):
    remote_file = f"{data}://{username}/{collection}/{fname}"
    algo_client.file(remote_file).putFile(local_filename)
    return remote_file
