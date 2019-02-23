import { AllActions } from 'actions';
import { StoreState } from 'types';
import {CHANGE_DRAG_ARRAY,GENERATE_SAMPLES,GENERATE_RULES, 
  CHANGE_RULE_THRESHOLD,CHANGE_SAMPLES_FETCH_STATUS, 
  CHANGE_RULES_FETCH_STATUS, CHANGE_PROTECTED_ATTR, 
  CHANGE_KEY_FETCH_STATUS, CHANGE_KEY_ATTR, CHANGE_SHOW_ATTRS,CHANGE_SHOW_DATASET} from 'Const';

import {filterRules} from 'Helpers';

const reducer = (state: StoreState, action: AllActions): StoreState => {
  // console.info('action',action)
  console.info('state', state)
    var {ruleThreshold, keyAttrNum, dragArray, allRules} = state
    switch (action.type) {
      case GENERATE_SAMPLES:
        return { ...state, samples:action.samples}
      case GENERATE_RULES:
        return { 
          ...state, 
          allRules:action.rules, 
          rules: filterRules(
            action.rules, 
            ruleThreshold, 
            dragArray.slice(0, keyAttrNum)
          )
        } 
      case CHANGE_PROTECTED_ATTR:  
        return { ...state, protectedAttr:action.protectedAttr}
      case CHANGE_SAMPLES_FETCH_STATUS:
        return { ...state, fetchSampleStatus: action.status}
      case CHANGE_RULES_FETCH_STATUS:
        return { ...state, fetchSampleStatus: action.status}
      case CHANGE_KEY_FETCH_STATUS:
        return { ...state, fetchKeyStatus: action.status}
      case CHANGE_SHOW_DATASET:
        return { ...state, showDataset: action.showDataset}
      case CHANGE_RULE_THRESHOLD:
        return { 
          ...state, 
          ruleThreshold: action.ruleThreshold,
          rules: filterRules(
            allRules, 
            action.ruleThreshold, 
            dragArray.slice(0, keyAttrNum)
          )
        }
      case CHANGE_DRAG_ARRAY:
        return { ...state, dragArray: action.dragArray}
      case CHANGE_KEY_ATTR:
        let {keyAttrs} = action
        return { 
          ...state, 
          keyAttrNum: keyAttrs.length, 
          dragArray: keyAttrs.concat(state.dragArray.filter(attr=>!keyAttrs.includes(attr))),
          rules: filterRules(allRules, ruleThreshold, keyAttrs)
        } 
      case CHANGE_SHOW_ATTRS:
        let {showAttrs} = action
        return { 
          ...state, 
          showAttrNum: showAttrs.length, 
          dragArray: showAttrs.concat(state.dragArray.filter(attr=>!showAttrs.includes(attr)))
        } 
      default:
        return state;
    }
  }
  
export default reducer