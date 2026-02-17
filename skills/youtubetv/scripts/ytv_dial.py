#!/usr/bin/env python3
"""
ytv_dial.py — YouTube DIAL controller: library + CLI
=====================================================

High-level YouTube wrapper around the generic :mod:`dial` library.
"""

from __future__ import annotations

import argparse
import logging
import sys
from typing import Optional

import requests

try:
    from dial import (
        AppState,
        DIALClient,
        DIALDevice,
        DeviceNotFoundError,
        DIALError,
        discover_devices,
    )
except ImportError:
    # If using as a library within a folder structure, try relative import
    try:
        from .dial import (
            AppState,
            DIALClient,
            DIALDevice,
            DeviceNotFoundError,
            DIALError,
            discover_devices,
        )
    except ImportError:
        # Fallback if executing script directly while dial is in same dir
        import dial
        AppState = dial.AppState
        DIALClient = dial.DIALClient
        DIALDevice = dial.DIALDevice
        DeviceNotFoundError = dial.DeviceNotFoundError
        DIALError = dial.DIALError
        discover_devices = dial.discover_devices

logger = logging.getLogger(__name__)

_YT_APP = "YouTube"

# ---------------------------------------------------------------------------
# YouTube-specific client
# ---------------------------------------------------------------------------


class YouTubeDIALClient:
    """
    YouTube-specific DIAL client built on top of :class:`dial.DIALClient`.

    Wraps the generic ``launch()`` / ``stop()`` / ``get_app_state()`` calls
    with named, YouTube-aware methods.
    """

    def __init__(self, device: DIALDevice, http_timeout: float = 8.0) -> None:
        self._client = DIALClient(device, http_timeout=http_timeout)

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def device(self) -> DIALDevice:
        """The target :class:`~dial.DIALDevice`."""
        return self._client.device

    # ------------------------------------------------------------------
    # App state
    # ------------------------------------------------------------------

    def get_app_state(self) -> AppState:
        """
        Query the current YouTube app state on the device.

        Returns
        -------
        AppState

        Raises
        ------
        requests.HTTPError
            Some Philips / MediaTek TVs return 403 until the app is launched.
        """
        return self._client.get_app_state(_YT_APP)

    # ------------------------------------------------------------------
    # Launch helpers
    # ------------------------------------------------------------------

    def launch_video(self, video_id: str) -> str:
        """
        Launch YouTube and start playing a video.

        Parameters
        ----------
        video_id:
            YouTube video ID, e.g. ``"dQw4w9WgXcQ"``.

        Returns
        -------
        str
            App instance URL returned by the device.
        """
        return self._client.launch(_YT_APP, {"v": video_id})

    def launch_playlist(
        self,
        playlist_id: str,
        video_id: Optional[str] = None,
    ) -> str:
        """
        Launch YouTube and start playing a playlist.

        Parameters
        ----------
        playlist_id:
            YouTube playlist ID (``list=`` query parameter).
        video_id:
            Optional starting video within the playlist.

        Returns
        -------
        str
            App instance URL returned by the device.
        """
        params: dict[str, str] = {"list": playlist_id}
        if video_id:
            params["v"] = video_id
        return self._client.launch(_YT_APP, params)

    def launch_search(self, query: str) -> str:
        """
        Open a YouTube search on the TV.

        Parameters
        ----------
        query:
            Search query string.

        Returns
        -------
        str
            App instance URL returned by the device.
        """
        return self._client.launch(_YT_APP, {"q": query})

    def launch_channel(self, channel_id: str) -> str:
        """
        Navigate to a YouTube channel page on the TV.

        Parameters
        ----------
        channel_id:
            YouTube channel ID (``UC…`` string).

        Returns
        -------
        str
            App instance URL returned by the device.
        """
        return self._client.launch(_YT_APP, {"channel": channel_id})

    # ------------------------------------------------------------------
    # Stop
    # ------------------------------------------------------------------

    def stop(self) -> bool:
        """
        Stop the YouTube app on the target device.

        Returns
        -------
        bool
            ``True`` if the app was stopped, ``False`` if it was not running.
        """
        return self._client.stop(_YT_APP)

    # ------------------------------------------------------------------
    # Convenience factory
    # ------------------------------------------------------------------

    @classmethod
    def from_address(
        cls,
        host: str,
        port: int = 8008,
        app_path: str = "/apps",
        **kwargs,
    ) -> "YouTubeDIALClient":
        """
        Build a :class:`YouTubeDIALClient` directly from a host address
        without SSDP discovery.
        """
        inner = DIALClient.from_address(host, port=port, app_path=app_path)
        return cls(inner.device, **kwargs)
