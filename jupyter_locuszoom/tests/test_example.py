#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Michał Krassowski.
# Distributed under the terms of the Modified BSD License.

import pytest

from ..locus_zoom import LocusZoom
from pandas import DataFrame


def test_example_creation_blank():
    df = DataFrame([{
        "CHROM": 1,
        "POS": 10000,
        "REF": 'A',
        "ALT": 'C',
        "P": 0.05
    }])
    w = LocusZoom(df)
    assert w
