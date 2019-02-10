import { AllActions } from 'actions';
import { StoreState } from 'types';
import {BAR_ARRAY,GENERATE_SAMPLES,GENERATE_RULES, 
  FIND_GROUPS, CHANGE_RULE_THRESHOLD,CHANGE_SAMPLES_FETCH_STATUS, 
  CHANGE_RULES_FETCH_STATUS, CHANGE_PROTECTED_ATTR, 
  CHANGE_GROUPS_FETCH_STATUS, CHANGE_KEY_ATTR} from 'Const'

const reducer = (state: StoreState, action: AllActions): StoreState => {
    switch (action.type) {
      case GENERATE_SAMPLES:
        return { ...state, samples:action.samples}
      case GENERATE_RULES:
        return { ...state, rules:action.rules}
      case FIND_GROUPS:  
        return { ...state, key_attrs:action.key_attrs, key_groups: action.key_groups}      
      case CHANGE_PROTECTED_ATTR:  
        return { ...state, protected_attr:action.protected_attr}
      case CHANGE_SAMPLES_FETCH_STATUS:
        return { ...state, fetch_samples_status: action.status}
      case CHANGE_RULES_FETCH_STATUS:
        return { ...state, fetch_samples_status: action.status}
      case CHANGE_GROUPS_FETCH_STATUS:
        return { ...state, fetch_groups_status: action.status}
      case CHANGE_RULE_THRESHOLD:
        return { ...state, thr_rules: action.thr_rules}
      case BAR_ARRAY:
        return { ...state, drag_array: action.drag_array}
      case CHANGE_KEY_ATTR:
        return {...state, key_attrs: action.key_attrs}
      default:
        return state;
    }
  }
  
export default reducer