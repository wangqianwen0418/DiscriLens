import * as React from 'react';
import 'components/Side.css'

import {Select, Col, Button} from 'antd';
const Option = Select.Option;

export interface Props{
  ruleThreshold:[number, number],
  onSelect: (showDataset:string)=>void,
  onStart: (dataset_name:string, model_name:string, protect_attr: string) => void,
  onChange: (ruleThreshold: number[])=> void,
}

export interface State{
  dataset_name: string,
  model_name: string,
  protect_attr: string,
}

export default class Side extends React.Component<Props, State>{
  public height=(window.innerHeight-50)*0.2/3;
  constructor(props: Props) {
    super(props);
    this.state = {
      dataset_name: 'adult',
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
      case 'adult': {this.setState({protect_attr:'sex'});this.setState({model_name:'xgb'});break}
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
    this.props.onSelect(dataset_name)
    this.setState({}) // force update
  }
  onChange(e:[number, number]){
    this.props.onChange(e)
    this.setState({}) // force update
  }
  onChangeLeft(min:number){
    this.props.onChange([min, this.props.ruleThreshold[1]])
    this.setState({}) // force update
  }
  onChangeRight(max:number){
    this.props.onChange([this.props.ruleThreshold[0], max])
    this.setState({}) // force update
  }
  
  public render(){
      let { protect_attr} = this.state
      return <div className='Side'>
          <div style={{height:this.height}}>
          <Col span={6}>
            <text className='tool-title' y={this.height/2} fontSize={12} >Data set</text>
          </Col>
            
          <Col span={18}>
            <Select size={'default'} defaultValue='adult' style={{ width: '150px', height: '50%'}} onChange={this.selectDataset}>
                  <Option value="academic">academic</Option>
                  <Option value="adult">adult</Option>
              </Select>
          </Col>
            
            
          </div>
          <div style={{height:this.height}}>
            <Col span={6}>
              <text className='tool-title' y={this.height/2} fontSize={12}>Prot Attr</text>
            </Col>
            <Col span={18}>
              <Select size={'default'} value={protect_attr} style={{ width: '150px', height: '50%' }} onChange={this.selectProtectAttr}>
                <Option value={protect_attr}>{protect_attr}</Option>
              </Select>
            </Col>
            

          </div>
          <div style={{height:this.height}}>
              <Button type='primary' shape='circle' icon='caret-right' padding-top={5} onClick={this.changeDataSet}/>
            </div>
    </div>
  }
}

