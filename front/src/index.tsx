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

let initState:StoreState

let dataSet = ['dataTest', 'academic', 'bank'],
    model = ['xgb', 'knn', 'lr'],
    protected_attr = ['sex', 'marital'],
    dataSelect = 2,
    modelSelect = 0,
    protected_attrSelect = 1

if (TEST){
    let filename = dataSet[dataSelect] + '_' + model[modelSelect]
    let {key_attrs, key_groups:jsonGroups} = require('./testdata/'+filename+'_key.json'), 
    jsonSamples = require('./testdata/'+filename+'_samples.json'),
    jsonRule = require('./testdata/'+filename+'_rules.json')
    initState = {
      key_attrs,
      key_groups: jsonGroups,
      samples: jsonSamples,
      rules: jsonRule,
      protected_attr: protected_attr[protected_attrSelect],
      fetch_samples_status: Status.COMPLETE,
      fetch_groups_status: Status.COMPLETE,
      thr_rules:[-0.1,0.1],
      drag_array: [],
      drag_status: false,
      show_attrs: [],
  }
}else{
  initState = {
    key_attrs: [],
    key_groups: [],
    samples: [],
    rules: [],
    protected_attr: '',
    fetch_samples_status: Status.COMPLETE,
    fetch_groups_status: Status.COMPLETE,
    thr_rules:[-0.1,0.1],
    drag_array: [],
    drag_status: false,
    show_attrs: [],
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

