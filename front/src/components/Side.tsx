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
      dataset_name: 'academic',
      model_name: 'lr',
      protect_attr: 'gender',
      };
    this.selectDataset = this.selectDataset.bind(this)
    this.selectModel = this.selectModel.bind(this)
    this.selectProtectAttr = this.selectProtectAttr.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onChangeLeft = this.onChangeLeft.bind(this)
    this.onChangeRight = this.onChangeRight.bind(this)
    this.onStart = this.onStart.bind(this)
    // initialize
  }
  selectDataset(e:string){
    this.setState({dataset_name: e})
  }
  selectModel(e:string){
    this.setState({model_name: e})
  }
  selectProtectAttr(e:string){
    this.setState({protect_attr: e})
  }
  onStart(e:any){
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
    // let {thr_rules} = this.props
      let defaultDataSet = 'academic', defaultModel = 'lr', defaultProAttr = 'gender'
      return <div onSubmit={this.onStart} className='Side'>
        <Row>
          <Col span={6}>
            <h1 className='tool-title'>Data set</h1>
            <h2 className='tool-title'>Model</h2>
            <h3 className='tool-title'>Prot Attr</h3>
          </Col>
          <Col span={18}>
            <Select size={'small'} defaultValue={defaultDataSet} style={{ width: '150px', height: '50%'}} onChange={this.selectDataset}>
                {
                  
                }
                <Option value="credit">credit</Option>
                <Option value="academic">academic</Option>
                <Option value="give_me_credit">give_me_credit</Option>
                <Option value="bank_term_deposit">bank_term_deposit</Option>
                <Option value="adult">adult</Option>
                <Option value="frisk">frisk</Option>
                <Option value="dataTest">dataTest</Option>
            </Select>

            <Select size={'small'} defaultValue={defaultModel} style={{ width: '150px', height: '50%' }} onChange={this.selectModel}>
              <Option value="knn">knn</Option>
              <Option value="rf">rf</Option>
              <Option value='xgb'>xgb</Option>
            </Select>

            <Select size={'small'} defaultValue={defaultProAttr} style={{ width: '150px', height: '50%' }} onChange={this.selectProtectAttr}>
              <Option value="sex">sex</Option>
              <Option value="gender">gender</Option>
            </Select>

          </Col>
            
        </Row>
        <Button type='primary' icon='right' onClick={this.onStart}></Button>
    </div>
  }
}

