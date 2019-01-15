import { AllActions } from 'actions';
import { StoreState } from 'types';
import {GENERATE_SAMPLES, FIND_GROUPS} from 'Const'

const reducer = (state: StoreState, action: AllActions): StoreState => {
    switch (action.type) {
      case GENERATE_SAMPLES:
        return { ...state, samples:action.samples}
      case FIND_GROUPS:  
        return { ...state, key_attrs:action.key_attrs, key_groups: action.key_groups}
      default:
        return state;
    }
  }
  
export default reducer