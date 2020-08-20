from . import demucs

def test_demucs():
    assert demucs.apply("Jane") == "hello Jane"
