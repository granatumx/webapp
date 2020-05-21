import update from 'immutability-helper';

import { UPDATE_STEP_JUST_CHANGED_STATUS } from '../../../../constants';

export default (state = { open: false, stepId: undefined, prevStatus: undefined, newStatus: undefined, error: undefined }, action) => {
  switch (action.type) {
    case UPDATE_STEP_JUST_CHANGED_STATUS:
      return update(state, action.payload);
    default:
      return state;
  }
};
