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

let dataSet:string = 'dataTest',
    model:string = 'xgb', 
    protected_attr:string = 'sex'

let initState:StoreState
if (TEST){
    let {key_attrs,jsonGroups} = require('./testdata/'+ dataSet + '_' + model + '_key.json'), 
    jsonSamples = require('./testdata/'+ dataSet + '_' + model + '_samples.json'),
    jsonRule = require('./testdata/'+ dataSet + '_' + model + '_rules.json')
    initState = {
      key_attrs: key_attrs,
      key_groups: jsonGroups,
      samples: jsonSamples,
      rules: jsonRule,
      protected_attr: protected_attr,
      fetch_samples_status: Status.COMPLETE,
      fetch_groups_status: Status.COMPLETE,
      thr_rules:[-0.1,0.5],
      drag_array: [],
      show_attrs: [],
      drag_status: false,
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
    show_attrs: [],
    drag_status: false,
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