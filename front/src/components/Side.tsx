import * as React from 'react';
import 'components/Side.css'

import {Select, Button} from 'antd';
const Option = Select.Option;

export interface Props{
  onGenerateSamples: (dataset_name:string, model_name:string) => void
}

export interface State{
  dataset_name: string,
  model_name: string
}

export default class Side extends React.Component<Props, State>{
  constructor(props: Props) {
    super(props);

    this.state = {
      dataset_name: 'credit',
      model_name: 'knn'
      };
    this.selectDataset = this.selectDataset.bind(this)
    this.selectModel = this.selectModel.bind(this)
    this.onGenerateSamples = this.onGenerateSamples.bind(this)
  }
  selectDataset(e:string){
    this.setState({dataset_name: e})
  }
  selectModel(e:string){
    this.setState({model_name: e})
  }
  onGenerateSamples(e:any){
    e.preventDefault();
    let {model_name, dataset_name} = this.state
    this.props.onGenerateSamples(dataset_name, model_name)
  }
  public render(){
      return <div onSubmit={this.onGenerateSamples} className='Side'>
        <Select placeholder="dataset" style={{ width: '100%' }} onChange={this.selectDataset}>
          <Option value="credit">credit</Option>
        </Select>

        <Select placeholder="model" style={{ width: '100%' }} onChange={this.selectModel}>
          <Option value="knn">knn</Option>
          <Option value="rf">rf</Option>
        </Select>

        <Button type="primary" shape="circle" icon="search" onClick={this.onGenerateSamples}/>
    </div>
  }
}

