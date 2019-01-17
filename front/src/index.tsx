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

let initState:StoreState = {
  key_attrs: [],
  key_groups: [],
  samples: [],
  fetch_samples_status: Status.INACTIVE,
  fetch_groups_status: Status.INACTIVE
}

 if (TEST){
  let testJSON = require('./testdata/test.json'), testJSON2 = require('./testdata/test2.json');
  initState = {
    key_attrs: testJSON2.key_attrs,
    key_groups: testJSON2.key_groups,
    samples: testJSON,
    fetch_samples_status: Status.COMPLETE,
    fetch_groups_status: Status.COMPLETE
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
