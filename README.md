
# jupyter-locuszoom

![Extension status](https://img.shields.io/badge/status-draft-critical "Draft")
[![Build Status](https://travis-ci.org/krassowski/jupyter-locuszoom.svg?branch=main)](https://travis-ci.org/krassowski/jupyter_locuszoom)
[![PyPI](https://img.shields.io/pypi/v/jupyter-locuszoom)](https://pypi.org/project/jupyter-locuszoom)

Jupyter Widget for LocusZoom

## Usage

Import `LocusZoom` in a notebook cell:

```python
# should it be renamed to ipylocuszoom? Let me know!
from jupyter_locuszoom import LocusZoom
```

and then use it with a GWAS result DataFrame which has to include columns `CHROM`, `REF`, `ALT`, `POS`, `P` (or `LOG10_P`):

```python
LocusZoom(
    assoc,
    chrom='15',    # optional (if not given top locus will be shown)
    start=0,       # optional (if nto given top locus on given chromosome will be shown)
    end=100_000,   # optional, but has to be given if start was given
    build='GRCh38'
)
```

![Example](https://github.com/krassowski/jupyter-locuszoom/assets/5832902/f7ee35fc-7024-477c-b411-c28670eed8cc)

Alternatively, center on a specific position:

```python
LocusZoom(
    assoc,
    chrom='15',
    position=123_456,
    flank=100_000,
    build='GRCh38'
)
```

## Installation

You can install using `pip`:

```bash
pip install jupyter_locuszoom
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] jupyter_locuszoom
```

## Development Installation

Create a dev environment:
```bash
conda create -n jupyter_locuszoom-dev -c conda-forge nodejs yarn python jupyterlab
conda activate jupyter_locuszoom-dev
```

Install the python. This will also build the TS package.
```bash
pip install -e ".[test, examples]"
```

When developing your extensions, you need to manually enable your extensions with the
notebook / lab frontend. For lab, this is done by the command:

```
jupyter labextension develop --overwrite .
yarn run build
```

For classic notebook, you need to run:

```
jupyter nbextension install --sys-prefix --symlink --overwrite --py jupyter_locuszoom
jupyter nbextension enable --sys-prefix --py jupyter_locuszoom
```

Note that the `--symlink` flag doesn't work on Windows, so you will here have to run
the `install` command every time that you rebuild your extension. For certain installations
you might also need another flag instead of `--sys-prefix`, but we won't cover the meaning
of those flags here.

### How to see your changes
#### Typescript:
If you use JupyterLab to develop then you can watch the source directory and run JupyterLab at the same time in different
terminals to watch for changes in the extension's source and automatically rebuild the widget.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
yarn run watch
# Run JupyterLab in another terminal
jupyter lab
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

#### Python:
If you make a change to the python code then you will need to restart the notebook kernel to have it take effect.

## Updating the version

To update the version, install tbump and use it to bump the version.
By default it will also create a tag.

```bash
pip install tbump
tbump <new-version>
```

