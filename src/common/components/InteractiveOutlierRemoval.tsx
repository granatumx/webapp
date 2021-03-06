import { Button, Typography as T } from '@material-ui/core';
import React from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { branch, lifecycle, renderNothing, withHandlers } from 'recompose';
import { compose } from 'redux';

import DonePageTray from './DonePageTray';
import GSelector from './GSelector';
import LoadingScreen from './LoadingScreen';

const IdlePage: React.FunctionComponent<any> = ({
  queryPlot,
  submitStep,
  gAvailImps,
  gGetState,
  gSetState,
  gResults,
  gGetMultipleExports,
  gQueryBackend,
  gIsClient,
  queryViz,
  updatePlot,
}) => {
  const plotRows =
    gIsClient &&
    gGetState(['vizCoordsData']) &&
    gGetState(['selected']) &&
    Object.entries(gGetState(['vizCoordsData']).coords).map(([k, v]) => ({
      __idx: k,
      dim1Data: v[0],
      dim2Data: v[1],
      selected: gGetState(['selected'])[k],
    }));
  let sel = gGetState(['selected']);

  return (
    <div>
      <T variant="h2">Interactive Outlier Removal</T>
      <GSelector
        kind="assay"
        label="Assay"
        gAvailImps={gAvailImps}
        currentSelection={gGetState(['assaySelection'])}
        setCurrentSelection={(x) => {
          gSetState(x, ['assaySelection']);
        }}
      />
      <GSelector
        kind="sampleCoords"
        label="Visualization coordinates"
        gAvailImps={gAvailImps}
        currentSelection={gGetState(['vizCoordsId'])}
        setCurrentSelection={(x) => {
          gSetState(x, ['vizCoordsId']);
        }}
      />
      <Button variant="contained" color="primary" onClick={queryPlot}>
        Plot
      </Button>
      {gGetState(['vizDataLoading']) && <T>Loading...</T>}
      {plotRows && (
        <div>
          <ResponsiveContainer width="100%" height={600}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dim1Data" name={gGetState(['vizCoordsData']).dimNames[0]} type="number" />
              <YAxis dataKey="dim2Data" name={gGetState(['vizCoordsData']).dimNames[1]} type="number" />
              <Scatter
                isAnimationActive={false}
                data={plotRows}
                fill="#8884d8"
                onClick={(e) => {
                  sel[e.__idx] = true;
                  gSetState(sel, ['selected']);
                  updatePlot(e);
                }}
              />
              <Scatter
                isAnimationActive={false}
                data={plotRows.filter((x) => x.selected)}
                fill="#ff0000"
                onClick={(e) => {
                  sel[e.__idx] = false;
                  gSetState(sel, ['selected']);
                  updatePlot(e);
                }}
              />
              <Tooltip isAnimationActive={false} cursor={{ strokeDasharray: '3 3' }} />
            </ScatterChart>
          </ResponsiveContainer>
          <Button variant="contained" color="primary" onClick={submitStep}>
            Remove selected points
          </Button>
        </div>
      )}
    </div>
  );
};

const DonePage: React.FunctionComponent<any> = ({ gIsClient, gReset, gResults, gNextStep }) => {
  const plotRows =
    gIsClient &&
    gResults.vizCoordsData &&
    gResults.selected &&
    Object.entries(gResults.vizCoordsData.coords).map(([k, v]) => ({
      __idx: k,
      dim1Data: v[0],
      dim2Data: v[1],
      selected: gResults.selected[k],
    }));

  return (
    <div>
      {gResults[0].data}
      <div>You will need to add a step to recalculate coordinates to remove additional outliers.</div>
      {plotRows && (
        <ResponsiveContainer width="100%" height={800}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dim1Data" name={gResults.vizCoordsData.dimNames[0]} type="number" />
            <YAxis dataKey="dim2Data" name={gResults.vizCoordsData.dimNames[1]} type="number" />
            <Scatter isAnimationActive={false} data={plotRows} fill="#8884d8" />
            <Scatter isAnimationActive={false} data={plotRows.filter((x) => x.selected)} fill="#ff0000" />
            <Tooltip isAnimationActive={false} cursor={{ strokeDasharray: '3 3' }} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
      <DonePageTray {...{ gReset, gNextStep }} />
    </div>
  );
};

const InteractiveOutlierRemoval = ({ gStatus, ...props }) => {
  switch (gStatus) {
    case 'IDLE':
      return <IdlePage {...props} />;
    case 'INITIATED':
      return <LoadingScreen label="Initiated ..." />;
    case 'RUNNING':
      return <LoadingScreen label="Running ..." />;
    case 'DONE':
      return <DonePage {...props} />;
    default:
      return null;
  }
};

const enhance = compose(
  withHandlers({
    queryViz: ({ gQueryBackend, gGetState, gSetState }) => () => {
      gQueryBackend({
        endpoint: 'getVizData',
      }).then((vizData) => {
        gSetState(vizData, ['vizData']);
        gSetState(false, ['vizDataLoading']);
      });
      gSetState(true, ['vizDataLoading']);
    },
    queryPlot: ({ gGetMultipleExports, gGetState, gSetState }) => () => {
      gGetMultipleExports({
        exportIds: [gGetState(['vizCoordsId'])],
      }).then(([vizCoordsData]) => {
        gSetState(vizCoordsData, ['vizCoordsData']);
        gSetState(Object.keys(vizCoordsData.coords).reduce((obj, k) => ({ ...obj, [k]: false }), {}), ['selected']);
      });
    },
    updatePlot: ({ gSetState }) => () => {
      gSetState(Math.random(), ['dummy']);
    },
  }),
  lifecycle<any, any>({
    componentDidMount() {
      const { gSetState, gGetState, updatePlot } = this.props;
      updatePlot();
    },
  }),
  branch(({ gGetState }) => gGetState == null, renderNothing),
  withHandlers({
    submitStep: ({ gGetState, gSubmitStep, gboxId }) => () => {
      gSubmitStep({
        gbox: gboxId,
        args: [
          {
            injectInto: 'outliers',
            value: Object.entries(gGetState(['selected']))
              .filter(([k, v]) => v)
              .map(([k, _v]) => k),
          },
        ],
        results: {
          vizCoordsData: gGetState(['vizCoordsData']),
          selected: gGetState(['selected']),
        },
        imports: [
          {
            exportId: gGetState(['assaySelection']),
            injectInto: 'assay',
          },
        ],
        exports: [
          {
            kind: 'assay',
            extractFrom: 'Outlier removed assay',
            meta: { dataType: '{matrix: number[][], sampleIds: string[], geneIds: string[]' },
          },
        ],
      });
    },
  }),
);

export default enhance(InteractiveOutlierRemoval);
