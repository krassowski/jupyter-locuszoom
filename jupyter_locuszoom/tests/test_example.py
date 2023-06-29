#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Michał Krassowski.
# Distributed under the terms of the Modified BSD License.

import pytest

from ..locus_zoom import LocusZoom


def test_example_creation_blank():
    w = LocusZoom()
    assert w.value == 'Hello World'
