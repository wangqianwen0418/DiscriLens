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
import 'intro.js/minified/introjs.min.css';

const TEST = true

let initState:StoreState

let dataSets = ['adult', 'academic', 'bank','credit'],
    models = ['xgb', 'knn', 'lr'],
    dataSelect = 1,
    modelSelect = 2,

    dataset = dataSets[dataSelect],
    model = models[modelSelect]

if (TEST){
    let filename = dataset + '_' + model
    let {keyAttrs, accuracy, causal} = require('./asset/'+dataset+'_key.json')
    let samples = require('./asset/'+filename+'_samples.json')
    let rules = require('./asset/'+filename+'_rules.json')
    let protectedVal = rules[0].pd
    let protectedAttr = protectedVal.split('=')[0]
    let ruleThreshold: [number, number] = [-0.25, 0.248]

    let dragArray = [...Object.keys(samples[0])]
    // remove the attribute 'id' and 'class'
    dragArray.splice(dragArray.indexOf('id'), 1)
    dragArray.splice(dragArray.indexOf('class'), 1)
    // if (dragArray.includes(protectedAttr)){
    //   dragArray.splice(dragArray.indexOf(protectedAttr), 1)
    // }  
    // move key attributes to the front
    // let keyAttrs =['StudentAbsenceDays', 'raisedhands', 'Discussion']
    // keyAttrs=['poutcome', 'education', 'previous']
    dragArray = keyAttrs.concat(dragArray.filter(attr=>!keyAttrs.includes(attr)))
    


    initState = {
      dataset, 
      models:[model],
      keyAttrNum: keyAttrs.length, 
      samples,
      allRules: rules,
      rules: filterRules(rules, ruleThreshold, keyAttrs),
      protectedAttr,
      protectedVal,
      fetchSampleStatus: Status.COMPLETE,
      fetchKeyStatus: Status.COMPLETE,
      ruleThreshold,
      dragArray,
      showAttrNum: keyAttrs.length,
      showDataset:dataset,
      xScaleMax: -1,
      selected_bar:['',''],
      compAllRules: null,
      compSamples:null,
      compRules:null,
      foldFlag: false,
      accuracy,
      compareList:{b2:[],r:[],p:0,yMax:0},
      compareOffset:{y:[],index:[]},
      expandRule:{id: 0, newAttrs:[], children: []},
      compareFlag:false,
      causal,
      unMatchedRules:{pos:[],neg:[]},
      offsetLength:0,
  }
}else{
  initState = {
    dataset,
    models:[model],
    keyAttrNum: 0,
    samples: [],
    allRules: [],
    rules: [],
    protectedAttr: '',
    protectedVal: '',
    fetchSampleStatus: Status.COMPLETE,
    fetchKeyStatus: Status.COMPLETE,
    ruleThreshold: [-0.1, 0.1],
    dragArray: [],
    showAttrNum: 0,
    showDataset: '',
    xScaleMax: -1,
    selected_bar: ['',''],
    compAllRules: null,
    compSamples:null,
    compRules:null,
    foldFlag: false,
    accuracy:{},
    compareList:{b2:[],r:[],p:0,yMax:0},
    compareOffset:{y:[],index:[]},
    expandRule:{id: 0, newAttrs:[], children: []},
    compareFlag:false,
    causal: [],
    unMatchedRules:{pos:[],neg:[]},
    offsetLength:0,
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