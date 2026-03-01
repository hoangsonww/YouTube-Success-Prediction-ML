from __future__ import annotations

import logging


def _has_root_handlers() -> bool:
    return bool(logging.getLogger().handlers)


def configure_logging(level: int = logging.INFO) -> None:
    """Configure application-wide logging once."""
    if _has_root_handlers():
        return
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
