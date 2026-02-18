from pathlib import Path

import pytest

from youtube_success_ml.data.loader import resolve_data_path


def test_resolve_data_path_from_cwd_data_dir(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    dataset_dir = tmp_path / "data"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    dataset_path = dataset_dir / "Global YouTube Statistics.csv"
    dataset_path.write_text("uploads,category,country\n1,Education,United States\n", encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("YTS_DATA_PATH", raising=False)

    resolved = resolve_data_path()
    assert resolved == dataset_path


def test_resolve_data_path_raises_for_missing_explicit_path(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        resolve_data_path(tmp_path / "missing.csv")
