import * as React from 'react';
import 'components/Side.css'

import {Select,Row, Col, Button} from 'antd';
const Option = Select.Option;

export interface Props{
  thr_rules:[number, number],
  onStart: (dataset_name:string, model_name:string, protect_attr: string) => void,
  onChange: (thr_rules: number[])=> void,
}

export interface State{
  dataset_name: string,
  model_name: string,
  protect_attr: string,
}

export default class Side extends React.Component<Props, State>{
  constructor(props: Props) {
    super(props);
    this.state = {
      dataset_name: 'dataTest',
      model_name: 'xgb',
      protect_attr: 'sex',
      };
    this.selectDataset = this.selectDataset.bind(this)
    this.selectModel = this.selectModel.bind(this)
    this.selectProtectAttr = this.selectProtectAttr.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onChangeLeft = this.onChangeLeft.bind(this)
    this.onChangeRight = this.onChangeRight.bind(this)
    this.changeDataSet = this.changeDataSet.bind(this)
    // initialize
  }
  selectDataset(e:string){
    this.setState({dataset_name: e})
    switch(e){
      case 'academic': {this.setState({protect_attr:'gender'});this.setState({model_name:'lr'});break}
      case 'bank': {this.setState({protect_attr:'maritary'});this.setState({model_name:'xgb'});break}
      case 'dataTest': {this.setState({protect_attr:'sex'});this.setState({model_name:'xgb'});break}
    }
  }
  selectModel(e:string){
    this.setState({model_name: e})
  }
  selectProtectAttr(e:string){
    this.setState({protect_attr: e})
  }
  changeDataSet(e:any){
    e.preventDefault();
    let {model_name, dataset_name, protect_attr} = this.state
    this.props.onStart(dataset_name, model_name, protect_attr)
  }
  onChange(e:[number, number]){
    this.props.onChange(e)
    this.setState({}) // force update
  }
  onChangeLeft(min:number){
    this.props.onChange([min, this.props.thr_rules[1]])
    this.setState({}) // force update
  }
  onChangeRight(max:number){
    this.props.onChange([this.props.thr_rules[0], max])
    this.setState({}) // force update
  }

  public render(){
      let {dataset_name, protect_attr, model_name} = this.state
      return <div className='Side'>
        <Row>
          <Col span={6}>
            <h1 className='tool-title'>Data set</h1>
            <h2 className='tool-title'>Model</h2>
            <h3 className='tool-title'>Prot Attr</h3>
          </Col>
          <Col span={18}>
            <Select size={'small'} defaultValue='dataTest' style={{ width: '150px', height: '50%'}} onChange={this.selectDataset}>
                <Option value="academic">academic</Option>
                <Option value="bank">bank</Option>
                <Option value="dataTest">dataTest</Option>
            </Select>

            <Select size={'small'} value={model_name} style={{ width: '150px', height: '50%' }} onChange={this.selectModel}>
                <Option value="lr">lr</Option>
                {dataset_name=='academic'?null:<Option value="knn">knn</Option>}
                {dataset_name=='academic'?null:<Option value="xgb">xgb</Option>}
            </Select>

            <Select size={'small'} value={protect_attr} style={{ width: '150px', height: '50%' }} onChange={this.selectProtectAttr}>
              <Option value={protect_attr}>{protect_attr}</Option>
            </Select>

          </Col>
            
        </Row>
        <Button type='primary' shape='circle' icon='caret-right' padding-top={5} onClick={this.changeDataSet}/>
        
    </div>
  }
}

