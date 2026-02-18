from youtube_success_ml.data.loader import load_dataset
from youtube_success_ml.visualization.maps import (
    build_category_dominance_map,
    build_country_metrics,
    build_earnings_choropleth,
    build_influence_map,
)


def test_map_builders_return_objects():
    df = load_dataset()
    influence = build_influence_map(df)
    earnings = build_earnings_choropleth(df)
    dominance = build_category_dominance_map(df)
    metrics = build_country_metrics(df)

    assert influence is not None
    assert earnings is not None
    assert dominance is not None
    assert len(metrics) > 0
