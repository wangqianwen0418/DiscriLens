import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from 'components/App';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { createStore,applyMiddleware } from 'redux';
import rootReducer from 'reducers';
import { StoreState, Status} from 'types';

import {filterRules} from "Helpers";



import 'antd/dist/antd.css';

const TEST = true

let initState:StoreState

let dataSets = ['dataTest', 'academic', 'bank'],
    models = ['xgb', 'knn', 'lr'],
    protectedAttrs = ['sex', 'marital'],
    dataSelect = 2,
    modelSelect = 0,
    protectedSelect = 1,

    dataSet = dataSets[dataSelect],
    model = models[modelSelect],
    protectedAttr = protectedAttrs[protectedSelect]

if (TEST){
    let filename = dataSet + '_' + model
    let {key_attrs: keyAttrs} = require('./testdata/'+dataSet+'_key.json')
    let samples = require('./testdata/'+filename+'_samples.json')
    let rules = require('./testdata/'+filename+'_rules.json')
    let ruleThreshold: [number, number] = [-0.1, 0.1]

    let dragArray = [...Object.keys(samples[0])]
    // remove the attribute 'id' and 'class'
    dragArray.splice(dragArray.indexOf('id'), 1)
    dragArray.splice(dragArray.indexOf('class'), 1)
    if (dragArray.includes(protectedAttr)){
      dragArray.splice(dragArray.indexOf(protectedAttr), 1)
    }  
    // move key attributes to the front
    // keyAttrs = ['StudentAbsenceDays', 'raisedhands', 'Discussion']
    keyAttrs=['poutcome', 'education', 'previous']
    dragArray = keyAttrs.concat(dragArray.filter(attr=>!keyAttrs.includes(attr)))
    


    initState = {
      keyAttrNum: keyAttrs.length, 
      samples,
      allRules: rules,
      rules: filterRules(rules, ruleThreshold, keyAttrs),
      protectedAttr,
      fetchSampleStatus: Status.COMPLETE,
      fetchKeyStatus: Status.COMPLETE,
      ruleThreshold,
      dragArray,
      showAttrNum: keyAttrs.length,
      showDataset:dataSet
  }
}else{
  initState = {
    keyAttrNum: 0,
    samples: [],
    allRules: [],
    rules: [],
    protectedAttr: '',
    fetchSampleStatus: Status.COMPLETE,
    fetchKeyStatus: Status.COMPLETE,
    ruleThreshold: [-0.05, 0.05],
    dragArray: [],
    showAttrNum: 0,
    showDataset: ''
}
}

const store = createStore(
  rootReducer,
  initState,
  applyMiddleware(thunk)
  )


ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();