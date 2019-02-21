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



import 'antd/dist/antd.css';

const TEST = true

let dataSet:string = 'academic',
    model:string = 'lr', 
    protectedAttr:string = 'gender'

let initState:StoreState

let dataSet = ['dataTest', 'academic', 'bank'],
    model = ['xgb', 'knn', 'lr'],
    protected_attr = ['sex', 'marital'],
    dataSelect = 2,
    modelSelect = 0,
    protected_attrSelect = 1

if (TEST){
    // let {jsonGroups} = require('./testdata/'+ dataSet + '_' + model + '_key.json')
    let samples = require('./testdata/'+ dataSet + '_' + model + '_samples.json'),
    rules = require('./testdata/'+ dataSet + '_' + model + '_rules.json'),
    dragArray = [...Object.keys(samples[0])],
    keyAttrs = ['StudentAbsenceDays', 'raisedhands', 'Discussion']


    // remove the attribute 'id' and 'class'
    dragArray.splice(dragArray.indexOf('id'), 1)
    dragArray.splice(dragArray.indexOf('class'), 1)
    if (dragArray.includes(protectedAttr)){
      dragArray.splice(dragArray.indexOf(protectedAttr), 1)
    }  
    // move key attributes to the front
    dragArray = keyAttrs.concat(dragArray.filter(attr=>!keyAttrs.includes(attr)))

    initState = {
      keyAttrNum: keyAttrs.length, 
      samples,
      rules,
      protectedAttr: protectedAttr,
      fetchSampleStatus: Status.COMPLETE,
      fetchKeyStatus: Status.COMPLETE,
      ruleThreshold:[-0.1,0.1],
      dragArray,
      showAttrNum: keyAttrs.length
  }
}else{
  initState = {
    keyAttrNum: 0,
    samples: [],
    rules: [],
    protectedAttr: '',
    fetchSampleStatus: Status.COMPLETE,
    fetchKeyStatus: Status.COMPLETE,
    ruleThreshold:[-0.1,0.1],
    dragArray: [],
    showAttrNum: 0
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