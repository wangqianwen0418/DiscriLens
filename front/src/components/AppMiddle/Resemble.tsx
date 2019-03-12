import * as React from 'react';
import Attributes from 'containers/Attributes';
import Itemsets from 'containers/Itemsets';
import Overview from 'containers/Overview';
import ModelSelection from 'containers/ModelSelection';
import Compared from 'containers/Compared';
import ComparePrime from 'containers/ComparePrime'
import {Col, Row} from 'antd';
import {DataItem,Rule} from 'types';

export interface Props{
   foldFlag:boolean,
   compSamples:DataItem[],
   rules:Rule[],
   samples:DataItem[],
   compRules:Rule[],
}

export default class AppMiddel extends React.Component<Props>{
    public step = 120;
    barWidth = this.step * 0.9;
    offsetX=110;
    offset = window.innerWidth * 0.25;
    render(){
        return <Row className='App-middle'>

         <Col span={this.props.foldFlag?1:4} className='App-left' id='App-left' style={{height:"100%"}}>
           <svg className='modelSelection' style={{width:"100%", height:"100%"}}>
              <ModelSelection/>
           </svg>
         </Col>

         <Col span={this.props.foldFlag?23:20} className='App-right' style={{height:"100%"}}>
         <svg className='overview' style={{width:"30%", height:"30%"}} >
             <Overview offset={this.offset}/>
         </svg>
         <svg className='attribute' style={{width:"70%", height: "30%"}}>
               <Attributes step={this.step} barWidth={this.barWidth} offsetX={this.offsetX}/>
           </svg>
           {!this.props.compSamples?
           <div className='itemset' style={{width: "100%", height: "70%", overflow: "auto"}}>
               <Itemsets compFlag={0} samples={this.props.samples} rules={this.props.rules} step={this.step} barWidth={this.barWidth} offsetX={this.offsetX} offset={this.offset}/>
           </div>
           :<div className='itemset' style={{width: "100%", height: "70%",overflowY: "scroll"}}>
               <Row className='modelCompare'>
                <Col span={12}>
                    <div id='compareLeft'>
                        <Compared compFlag={1} samples={this.props.compSamples} rules={this.props.compRules} step={this.step} barWidth={this.barWidth} offsetX={this.offsetX} offset={this.offset}/>
                    </div>
                </Col>
                
                <Col span={12}>
                    <div style={{overflowX:'scroll'}} id='compareRight'>
                        <ComparePrime compFlag={-1} samples={this.props.samples} rules={this.props.rules} step={this.step} barWidth={this.barWidth} offsetX={this.offsetX} offset={this.offset}/>
                    </div>
                </Col>
               </Row>
           </div>
            }
       </Col>
       </Row>
    }
}