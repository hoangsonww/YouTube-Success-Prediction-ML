from youtube_success_ml.data.loader import load_dataset


def test_load_dataset_has_required_columns():
    df = load_dataset()
    required = {
        "uploads",
        "category",
        "country",
        "age",
        "subscribers",
        "highest_yearly_earnings",
        "growth_target",
        "latitude",
        "longitude",
    }
    assert required.issubset(set(df.columns))
    assert len(df) > 500
    assert df["age"].min() >= 0
