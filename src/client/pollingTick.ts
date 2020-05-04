import gql from 'graphql-tag';
import { RFR_PROJECT_STEP, UPDATE_STEP_JUST_CHANGED_STATUS } from '../common/constants';
import { delay } from '../common/utils';

const PROBE_INTERVAL = 1000;

export default async (store, apolloClient) => {
  let prevStepProbes = null;
  let executionStatus = {};

  // noinspection InfiniteLoopJS
  while (true) {
    await delay(PROBE_INTERVAL);
    const state = store.getState();

    if (state.location.type !== RFR_PROJECT_STEP) {
      continue;
    }

    // Check the UpdateAt for all steps in the current project.
    // If the server has a newer UpdateAt, update the data

    const currentProjectId = state.app.currentProjectId;
    const currentStepId = state.app.currentStepId;

    if (currentProjectId == null || currentStepId == null) {
      continue;
    }

    const resPollingWhetherNecessary = await apolloClient.query({
      query: gql`
        query PollingWhetherNecessary($currentProjectId: UUID!) {
          projectById(id: $currentProjectId) {
            id
            stepsByProjectId {
              nodes {
                id
                status
              }
            }
          }
        }
      `,
      variables: { currentProjectId },
    });

    const stepStatusesProject = resPollingWhetherNecessary.data.projectById;

    if (stepStatusesProject == null) {
      // No update necessary
      continue;
    }

    const stepStatuses = stepStatusesProject.stepsByProjectId.nodes.map((x) => x.status);

    if (stepStatuses.indexOf('INITIATED') === -1) {
      continue;
    }

    const resPollingTick = await apolloClient.query({
      query: gql`
        query PollingGetUpdateAt($currentProjectId: UUID!) {
          projectById(id: $currentProjectId) {
            id
            stepsByProjectId {
              nodes {
                id
                updatedAt
              }
            }
          }
        }
      `,
      variables: { currentProjectId },
      fetchPolicy: 'network-only',
    });

    const stepProbes = resPollingTick.data.projectById.stepsByProjectId.nodes.filter(({id, status, updateAt }) => executionStatus[id] == undefined);
    stepProbes.forEach(({id, status, updateAt}) => executionStatus[id] = status);

    stepProbes.map(async ({ id, status, updatedAt }) => {
      let prevStatus = status;
      let newStatus = status;

      while(newStatus !== 'DONE') {
        await delay(PROBE_INTERVAL);
        const res = await apolloClient.query({
          query: gql`
            query PollingUpdateStep($id: UUID!) {
              stepById(id: $id) {
                id
                status
                exportsByStepId {
                  nodes {
                    id
                    kind
                    meta
                    name
                  }
                }
                results
                errors
                state
              }
            }`,
          variables: { id },
          fetchPolicy: 'network-only',
        });

        prevStatus = newStatus;
        newStatus = res.data.stepById.status;

        if (prevStatus !== newStatus) {
          store.dispatch({
            type: UPDATE_STEP_JUST_CHANGED_STATUS,
            payload: { $set: { open: true, id, prevStatus, newStatus } },
          });
        }
      }
      executionStatus[id] = undefined;
    });
  }
};
