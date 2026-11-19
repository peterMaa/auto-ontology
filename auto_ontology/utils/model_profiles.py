# SPDX-FileCopyrightText: Copyright (c) 2026, NVIDIA CORPORATION & AFFILIATES.
# All rights reserved.
# SPDX-License-Identifier: Apache-2.0

"""Selectable reasoning-model profiles.

The reasoning role (question intent, extraction, SQL generation, validation) can
be served by more than one endpoint. The default profile is the existing
``REASONING_*`` triplet; an optional alternative — DeepSeek by default — is
declared with ``REASONING_ALT_*``. The selection is per question: the chat
endpoint accepts ``reasoning_model`` and the worker subprocess sets it before
running the pipeline.

Only the reasoning role is switchable. ``EMBED`` and ``RERANK`` stay on the NIM
triplets: changing the embedding model would invalidate every stored vector.
"""

from __future__ import annotations

import os
from contextvars import ContextVar
from dataclasses import dataclass

DEFAULT_PROFILE_ID = "nim"

# Set per request inside the worker process. Contexts do not cross the
# multiprocessing boundary, so the worker sets this explicitly for every ask.
_active_profile: ContextVar[str] = ContextVar(
    "auto_ontology_reasoning_profile", default=DEFAULT_PROFILE_ID
)


@dataclass(frozen=True)
class ReasoningProfile:
    """One selectable reasoning endpoint."""

    id: str
    label: str
    endpoint: str
    api_key: str
    model: str

    @property
    def provider(self) -> str:
        """Coarse provider tag, used to pick request quirks (e.g. thinking mode)."""
        endpoint = self.endpoint.lower()
        for name in ("deepseek", "nvidia", "openai", "anthropic"):
            if name in endpoint:
                return name
        return "openai"


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, "").strip() or default


def default_profile() -> ReasoningProfile:
    """The deployment's primary reasoning trio (``REASONING_*``)."""
    from auto_ontology.utils.model_config import resolve

    return ReasoningProfile(
        id=DEFAULT_PROFILE_ID,
        label=_env("REASONING_PROFILE_LABEL", "NVIDIA NIM"),
        endpoint=resolve("REASONING", "ENDPOINT"),
        api_key=resolve("REASONING", "API_KEY"),
        model=resolve("REASONING", "MODEL"),
    )


def alternative_profile() -> ReasoningProfile | None:
    """The optional second trio, or ``None`` when it is not configured."""
    endpoint = _env("REASONING_ALT_ENDPOINT")
    api_key = _env("REASONING_ALT_API_KEY")
    model = _env("REASONING_ALT_MODEL")
    if not (endpoint and api_key and model):
        return None
    return ReasoningProfile(
        id=_env("REASONING_ALT_ID", "deepseek"),
        label=_env("REASONING_ALT_LABEL", "DeepSeek"),
        endpoint=endpoint,
        api_key=api_key,
        model=model,
    )


def available_profiles() -> list[ReasoningProfile]:
    """Every profile that can actually be used right now."""
    profiles = [default_profile()]
    alt = alternative_profile()
    if alt is not None:
        profiles.append(alt)
    return profiles


def resolve_profile(profile_id: str | None) -> ReasoningProfile | None:
    """Look up a profile by id; ``None`` when unknown or unconfigured."""
    if not profile_id:
        return None
    for profile in available_profiles():
        if profile.id == profile_id:
            return profile
    return None


def set_active_profile(profile_id: str | None) -> None:
    _active_profile.set(profile_id or DEFAULT_PROFILE_ID)


def get_active_profile() -> str:
    return _active_profile.get()
