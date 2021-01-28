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

    const resPollingTick = await apolloClient.query({
      query: gql`
        query PollingGetUpdateAt($currentProjectId: UUID!) {
          projectById(id: $currentProjectId) {
            id
            stepsByProjectId {
              nodes {
                id
		status
                updatedAt
              }
            }
          }
        }
      `,
      variables: { currentProjectId },
      fetchPolicy: 'network-only',
    });

    if (resPollingTick.data.projectById == null) {
       continue;
    }

    const stepProbes = resPollingTick.data.projectById.stepsByProjectId.nodes.filter(({id, status, updatedAt }) => executionStatus[id] == undefined).filter(({id, status, updatedAt}) => status !== 'IDLE');
    stepProbes.forEach(({id, status, updatedAt}) => executionStatus[id] = status);

    stepProbes.map(async ({ id, status, updatedAt }) => {
      let prevStatus = status;
      let newStatus = status;
      let firsttime = true;

      while(newStatus !== 'IDLE') { // && newStatus !== 'DONE') {
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
        newStatus = (res.data.stepById == null) ? prevStatus : res.data.stepById.status;

        if (firsttime) {
          store.dispatch({ type: UPDATE_STEP_JUST_CHANGED_STATUS, payload: { $set: { open: false, stepId: id, prevStatus: prevStatus, newStatus: newStatus, errors: res.data.stepById.errors } }});
          firsttime = false;
        } else if (newStatus === 'DONE') { // || newStatus === 'IDLE') {
          store.dispatch({ type: UPDATE_STEP_JUST_CHANGED_STATUS, payload: { $set: { open: true, stepId: id, prevStatus: prevStatus, newStatus: newStatus, errors: res.data.stepById.errors } }});

        } else {
          store.dispatch({ type: UPDATE_STEP_JUST_CHANGED_STATUS, payload: { $set: {stepId: id, prevStatus: prevStatus, newStatus: newStatus, errors: res.data.stepById.errors}} });
        }
      }
      executionStatus[id] = undefined;
    });
  }
};
