#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Michał Krassowski.
# Distributed under the terms of the Modified BSD License.

from ipywidgets import DOMWidget
from traitlets import Unicode, Integer, validate, observe, TraitError, Dict
from typing import Dict as DictType, TYPE_CHECKING
if TYPE_CHECKING:
    from pandas import DataFrame
else:
    DataFrame = None

from ._frontend import module_name, module_version


class LocusZoom(DOMWidget):
    """TODO: Add docstring here
    """
    _model_name = Unicode('LocusZoomModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('LocusZoomView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    def __init__(
      self, associations,
      chrom=None, start=None, end=None, position=None,
      flank=500_000,
      **kwargs
    ):
        super().__init__(**kwargs)
        self.associations = associations
        associations = self.associations

        if chrom is not None:
            if start is None and end is None:
                # find top locus on this chrom
                view = associations[associations.chr == chrom]
                index = view['log_pvalue'].idxmax()
                locus = view.loc[index]
                start = locus.position - flank // 2
                end = locus.position + flank // 2
            elif position is not None:
                # center on position with a given flank
                start = position - flank // 2
                end = position + flank // 2
            elif (start is None or end is None):
                raise ValueError('Provide either: `position`, or both: `start` and `end`')
        else:
            index = associations['log_pvalue'].idxmax()
            # find top locus
            locus = associations.loc[index]
            start = locus.position - flank // 2
            end = locus.position + flank // 2
            chrom = locus.chr

        start = max(1, start)
        end = max(1, end)

        self.position = {
          'chr': str(chrom),
          'start': int(start),
          'end': int(end)
        }

    @property
    def associations(self):
        return self._associations

    @associations.setter
    def associations(
      self, associations: DataFrame
    ):
        # TODO: support formats other than pandas DataFrame,
        # especially polars
        tolerance = {
          '#CHROM': 'chr',
          'CHROM': 'chr',
          'POS': 'position',
          'P': 'pvalue',
          'LOG10_P': 'log_pvalue',
          'T_STAT': 'scoreTestStat',
          'REF': 'ref_allele',
          # refAlleleFreq
        }
        # TODO check overlap
        associations = associations.rename(columns=tolerance)
        required_columns = ['ref_allele', 'ALT', 'chr', 'position']
        for required_column in required_columns:
            if required_column not in associations.columns:
              raise ValueError(f'Required column missing: {required_column}')
        # harmonise type - TODO do not cast if already string
        associations['chr'] = associations['chr'].astype(str)
        # TODO: coerce position to integer if not already
        if 'log_pvalue' not in associations.columns:
            if 'pvalue' in associations.columns:
                from math import log10
                associations['log_pvalue'] = -associations['pvalue'].apply(log10)
            else:
                raise ValueError('Neither `pvalue` nor log_pvalue (recommended) is in columns')

        associations['variant'] = (
            associations['chr']
            + ':' + associations['position'].apply(str)
            + '_' + associations['ref_allele']
            + '/' + associations['ALT']
        )
        # not needed, but could be fun to implement multi-analysis
        # associations['analysis'] = 0
        self._associations = associations
        self._by_chrom = associations.groupby('chr')
        #self._update_view();

    def _update_view(self):
        # TODO use tabix?
        query_range = self.position
        df = self._by_chrom.get_group(query_range['chr'])
        filtered = df[
          (df.position >= query_range['start'])
          &
          (df.position <= query_range['end'])
        ]
        data_dict = {
          'data': filtered.to_dict(orient='list'),
          'range': query_range
        }
        self._associations_view = data_dict

    _associations_view = Dict().tag(sync=True)
    build = Unicode('GRCh38').tag(sync=True)
    position: DictType = Dict(
      {},
      per_key_traits={'chr': Unicode(), 'start': Integer(), 'end': Integer()}
    ).tag(sync=True)

    @observe('position')
    def update(self, event):
        self._update_view();

    @validate('position')
    def _valid_value(self, proposal):
        if proposal['value']['start'] < 0:
            raise TraitError('Start position must be positive')
        return proposal['value']

    """
    @property
    def start(self):
        return self.position['start']

    @start.setter
    def start(self, value):
        self.position = {
          **self.position,
          'start': value
        }

    @property
    def end(self):
        return self.position['end']

    @end.setter
    def end(self, value):
        self.position = {
          **self.position,
          'end': value
        }

    @property
    def chrom(self):
        return self.position['chr']

    @chrom.setter
    def chrom(self, value):
        self.position = {
          **self.position,
          'chr': value
        }
    """
