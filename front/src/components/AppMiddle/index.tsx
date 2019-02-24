 import * as React from 'react';
 import Attributes from 'containers/Attributes';
 import Itemsets from 'containers/Itemsets';
 import Overview from 'containers/Overview';
 import ModelSelection from 'containers/ModelSelection';
 import {Col, Row} from 'antd';

 export default class AppMiddel extends React.Component{
     public step = 120;
     barWidth = this.step * 0.9;
     offsetX=110;
     render(){
         return <Row className='App-middle'>

          <Col span={4} className='App-left' id='App-left' style={{height:"100%"}}>
            <svg className='overview' style={{width:"100%", height:"30%"}}>
              <Overview/>
            </svg>
            <svg className='modelSelection' style={{width:"100%", height:"70%"}}>
              <ModelSelection/>
            </svg>
          </Col>

          <Col span={20} className='App-right' style={{height:"100%"}}>
          <svg className='attribute' style={{width:"100%", height: "25%"}}>
                <Attributes step={this.step} barWidth={this.barWidth} offsetX={this.offsetX}/>
            </svg>
            <div className='itemset' style={{width: "100%", height: "75%", overflowY: "scroll"}}>
                <Itemsets step={this.step} barWidth={this.barWidth} offsetX={this.offsetX}/>
            </div>
        </Col>
        </Row>
     }
 }