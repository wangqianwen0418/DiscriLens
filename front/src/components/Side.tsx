import * as React from 'react';
import 'components/Side.css'

import {Select, Button} from 'antd';
const Option = Select.Option;

export interface Props{
  onStart: (dataset_name:string, model_name:string) => void
}

export interface State{
  dataset_name: string,
  model_name: string
}

export default class Side extends React.Component<Props, State>{
  constructor(props: Props) {
    super(props);

    this.state = {
      dataset_name: 'dataTest',
      model_name: 'knn'
      };
    this.selectDataset = this.selectDataset.bind(this)
    this.selectModel = this.selectModel.bind(this)
    this.onStart = this.onStart.bind(this)
  }
  selectDataset(e:string){
    this.setState({dataset_name: e})
  }
  selectModel(e:string){
    this.setState({model_name: e})
  }
  onStart(e:any){
    e.preventDefault();
    let {model_name, dataset_name} = this.state
    this.props.onStart(dataset_name, model_name)
  }
  public render(){
      return <div onSubmit={this.onStart} className='Side'>
        <Select defaultValue='dataTest' style={{ width: '100%' }} onChange={this.selectDataset}>
          <Option value="dataTest">dataTest</Option>
          <Option value="xAPI-Edu-Data">xAPI-Edu-Data</Option>
        </Select>

        <Select defaultValue='knn' style={{ width: '100%' }} onChange={this.selectModel}>
          <Option value="knn">knn</Option>
          <Option value="rf">rf</Option>
        </Select>

        <Button type="primary" shape="circle" icon="caret-right" onClick={this.onStart}/>
    </div>
  }
}

