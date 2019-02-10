import * as React from 'react';
import 'components/Side.css'

import {Select, Button, Slider, Row, Col} from 'antd';
const Option = Select.Option;

export interface Props{
  thr_rules:number[],
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
      model_name: 'knn',
      protect_attr: 'sex',
      };
    this.selectDataset = this.selectDataset.bind(this)
    this.selectModel = this.selectModel.bind(this)
    this.selectProtectAttr = this.selectProtectAttr.bind(this)
    this.onChange = this.onChange.bind(this)
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
  onChange(e:any){
    this.props.onChange(e)
  }

  public render(){
    let {thr_rules} = this.props

      return <div onSubmit={this.onStart} className='Side'>
      <Col span={12}>
        <Row>
          <Col span={12}>
            <h1 className='tool-title'>Data set</h1>
          </Col>
          <Col span={12}>
            <Select size={'small'} defaultValue='academic' style={{ width: '100%', height: '50%'}} onChange={this.selectDataset}>
                <Option value="credit">credit</Option>
                <Option value="academic">academic</Option>
                <Option value="give_me_credit">give_me_credit</Option>
                <Option value="bank_term_deposit">bank_term_deposit</Option>
                <Option value="adult">adult</Option>
                <Option value="frisk">frisk</Option>
                <Option value="dataTest">dataTest</Option>
              </Select>
          </Col>
            
        </Row>
        <Row>
          <Col span={12}> 
            <h2 className='tool-title'>Model</h2>
          </Col>
          <Col span={12}>
            <Select size={'small'} defaultValue='knn' style={{ width: '100%', height: '50%' }} onChange={this.selectModel}>
              <Option value="knn">knn</Option>
              <Option value="rf">rf</Option>
              <Option value='xgb'>xgb</Option>
            </Select>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <h3 className='tool-title'>Prot Attr</h3>
          </Col>
          <Col span={12}>
            <Select size={'small'} defaultValue='gender' style={{ width: '100%', height: '50%' }} onChange={this.selectProtectAttr}>
              <Option value="sex">sex</Option>
              <Option value="gender">gender</Option>
            </Select>
          </Col>
        </Row>
      </Col>

      <Col span={12}>
          <h4 className='tool-title'>Threshold: {String.fromCharCode(60)} {thr_rules[0]}  or {String.fromCharCode(62)} {thr_rules[1]} </h4>
          <Slider min={-1} max={1} step={0.01} range={true} defaultValue={[-0.2,0.2]} onChange={this.onChange} />
          <Button type="primary" shape="circle" icon="caret-right" onClick={this.onStart}/>
      </Col>       
    </div>
  }
}

