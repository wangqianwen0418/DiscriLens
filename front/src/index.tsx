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
 if (TEST){
    let jsonGroups = require('./testdata/groups_dataTest_knn.json'), 
    jsonSamples = require('./testdata/dataTest_knn_samples.json'),
    jsonRule = require('./testdata/dataTest_knn_rules.json')
    initState = {
      key_attrs: ["hours_per_week", 
      "relationship", 
      "education_num"],
      key_groups: jsonGroups,
      samples: jsonSamples,
      rules: jsonRule,
      protected_attr: 'sex',
      fetch_samples_status: Status.COMPLETE,
      fetch_groups_status: Status.COMPLETE,
      thr_rules:[-0.1,0.1],
      drag_array: [],
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

