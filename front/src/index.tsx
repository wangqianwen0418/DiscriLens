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

const TEST = false

let initState:StoreState = {
  key_attrs: [],
  key_groups: [],
  samples: [],
  rules: [],
  protected_attr: '',
  fetch_samples_status: Status.INACTIVE,
  fetch_groups_status: Status.INACTIVE,
  thr_rules:[-0.1,0.1],
  drag_array: [],
}

 if (TEST){
 
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

