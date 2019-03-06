// import axios from 'axios';
import * as React from 'react';
import './App.css';
import {Col, Row} from 'antd';

import Samples from 'containers/Samples';
import Side from 'containers/Side';
import AppMiddle from 'components/AppMiddle';

// const axiosInstance = axios.create({
//   baseURL: `http://localhost:7777/api/`,
//   // timeout: 1000,
//   headers: {
//       'Access-Control-Allow-Origin': '*'
//   }
// });

// import {IDataItem} from 'types'

import logo from 'logo.png';

// export interface IState{
//   samples: any[],
//   keyAttrs: any[],
//   keyGroups: any[]
// }

class App extends React.Component {
  constructor(props: {}) {
    super(props);
    this.state={
      samples: [],
      keyAttrs: [],
      keyGroups: []
    }
  }
  // public async componentDidMount(){
  //   const url = '/groups?dataset=credit&model=knn'
  //   const res = await axiosInstance.get(url);
  //   if (res.status === 200) {
  //     // console.info(res.data)
  //     this.setState(
  //       {
  //         samples: res.data.model_samples,
  //         keyAttrs: res.data.key_attrs,
  //         keyGroups: res.data.key_groups
  //       }
  //     );
  //   }
  // }
  public render() {

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p className="App-title">Discrimination in Machine Learning</p>
        </header>
        <AppMiddle />
        <Row className='App-bottom'>
          <Col span={4}>
            <Side/>
          </Col>
          <Col span={20}>
            <Samples />
          </Col>
        </Row>

      </div>
    );
  }
}

export default App;
