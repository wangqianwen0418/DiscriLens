import { AllActions } from 'actions';
import { StoreState } from 'types';
import {GENERATE_SAMPLES, FIND_GROUPS, CHANGE_SAMPLES_FETCH_STATUS, CHANGE_GROUPS_FETCH_STATUS} from 'Const'

const reducer = (state: StoreState, action: AllActions): StoreState => {
    switch (action.type) {
      case GENERATE_SAMPLES:
        return { ...state, samples:action.samples}
      case FIND_GROUPS:  
        return { ...state, key_attrs:action.key_attrs, key_groups: action.key_groups}
      case CHANGE_SAMPLES_FETCH_STATUS:
        return { ...state, fetch_samples_status: action.status}
      case CHANGE_GROUPS_FETCH_STATUS:
        return { ...state, fetch_groups_status: action.status}
      default:
        return state;
    }
  }
  
export default reducer