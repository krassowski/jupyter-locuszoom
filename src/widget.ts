// Copyright (c) Michał Krassowski
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';
import { UUID } from '@lumino/coreutils';
import { Message } from '@lumino/messaging';

import LocusZoom from 'locuszoom';

import { MODULE_NAME, MODULE_VERSION } from './version';
import { untilReady } from './utils';

// Import the CSS
import 'locuszoom/dist/locuszoom.css';
import '../css/widget.css';

export class LocusZoomModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: LocusZoomModel.model_name,
      _model_module: LocusZoomModel.model_module,
      _model_module_version: LocusZoomModel.model_module_version,
      _view_name: LocusZoomModel.view_name,
      _view_module: LocusZoomModel.view_module,
      _view_module_version: LocusZoomModel.view_module_version,
      build: 'GRCh38',
      position: {
        chr: '1',
        start: 0,
        end: 5000000,
      },
      _associations_view: {
        range: {
          chr: '1',
          start: 0,
          end: 5000000,
        },
      },
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'LocusZoomModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'LocusZoomView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

interface IRequestOptions {
  chr: string;
  start: number;
  end: number;
}

const AssociationLZ = LocusZoom.Adapters.get('AssociationLZ');

class ModelAssociation extends AssociationLZ {
  model: LocusZoomModel;
  constructor(config: { model: LocusZoomModel }) {
    super({});
    this.model = config.model;
  }

  async _performRequest(options: IRequestOptions) {
    // TODO: find a way to fetch view properly
    await untilReady(() => {
      const view = this.model.get('_associations_view');
      const position = view.range;
      return (
        position.chr === options.chr &&
        position.start === options.start &&
        position.end === options.end
      );
    });
    return this.model.get('_associations_view');
  }
}
// A custom adapter should be added to the registry before using it
LocusZoom.Adapters.add('ModelAssociation', ModelAssociation);

export class LocusZoomView extends DOMWidgetView {
  container: HTMLDivElement;
  plot: any;
  constructor(options: any) {
    super(options);
    this.container = document.createElement('div');
    this.container.id = 'locus-zoom-' + UUID.uuid4();
    this.el.appendChild(this.container);
  }
  _processLuminoMessage(msg: Message, _super: (msg: Message) => void): void {
    _super.call(this, msg);
    switch (msg.type) {
      case 'resize':
        console.log('resize message');
        window.requestAnimationFrame(() => this.plot.rescaleSVG());
        break;
    }
  }
  processPhosphorMessage(msg: Message): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this._processLuminoMessage(msg, super.processPhosphorMessage);
  }

  processLuminoMessage(msg: Message): void {
    this._processLuminoMessage(msg, super.processLuminoMessage);
  }
  render() {
    const apiBase = 'https://portaldev.sph.umich.edu/api/v1/';
    const build = this.model.get('build');

    const dataSources = new LocusZoom.DataSources();
    dataSources
      .add('assoc', ['ModelAssociation', { model: this.model }])
      .add('ld', [
        'LDServer',
        {
          url: 'https://portaldev.sph.umich.edu/ld/',
          source: '1000G',
          build,
          population: 'ALL',
        },
      ])
      .add('gene', ['GeneLZ', { url: apiBase + 'annotation/genes/', build }])
      .add('recomb', [
        'RecombLZ',
        { url: apiBase + 'annotation/recomb/results/', build },
      ])
      .add('constraint', [
        'GeneConstraintLZ',
        { url: 'https://gnomad.broadinstitute.org/api/', build },
      ]);
    // TODO:
    //.add("phewas", ["PheWASLZ", {url: "https://portaldev.sph.umich.edu/" + "api/v1/statistic/phewas/", build: [build]}])

    const initialState = this.positionState;
    console.log(initialState);
    const layout = LocusZoom.Layouts.get('plot', 'standard_association', {
      state: initialState,
    });

    // d3 assumes the node is already in the DOM and will fail if we do not attach it temporarily.
    const attached = this.el.parentElement !== null;
    if (!attached) {
      document.body.appendChild(this.el);
    }
    const plot = LocusZoom.populate(
      '#' + this.container.id,
      dataSources,
      layout
    );
    if (!attached) {
      document.body.removeChild(this.el);
    }
    this.plot = plot;

    plot.on('state_changed', () => {
      const position = this.model.get('position');
      if (
        plot.state.start === position.start &&
        plot.state.end === position.end &&
        plot.state.chr === position.chr
      ) {
        return;
      }
      console.log('plot state changed, will set kernel state to', plot.state);
      this.model.set('position', {
        start: plot.state.start,
        end: plot.state.end,
        chr: plot.state.chr,
      });
      this.model.save_changes();
    });

    const updateState = () => {
      console.log(
        'kernel state changed, will set state to ',
        this.positionState
      );
      plot.applyState({ ...this.positionState, ldrefvar: '' });
    };

    // listen to changes of state in kernel and update view accordingly
    this.model.on('change:position', updateState);
    this.displayed.then(() => {
      this.plot.rescaleSVG();
    });
  }

  get positionState() {
    return this.model.get('position');
  }
}
