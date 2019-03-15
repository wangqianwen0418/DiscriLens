import * as React from 'react';
import Attributes from 'containers/Attributes';
import Itemsets from 'containers/Itemsets';
import Overview from 'containers/Overview';
import ModelSelection from 'containers/ModelSelection';
import Compared from 'containers/Compared';
import ComparePrime from 'containers/ComparePrime'
import {Col, Row, Switch} from 'antd';
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
    viewSwitch = true;
    render(){
        let changeView=()=>{
            this.viewSwitch = !this.viewSwitch
            this.setState({})
        }
        let switchX = this.props.foldFlag?window.innerWidth/4:window.innerWidth/5
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
               <Attributes step={this.step} barWidth={this.barWidth} offsetX={this.offsetX} foldFlag={this.props.foldFlag}/>
           </svg>
           {!this.props.compSamples?
           <div className='itemset' style={{width: "100%", height: "70%"}}>
                <div style={{width: "12%", height: "10%",position:'relative',left:switchX}}>
                    <text>View Switch</text>
                    
                    <div style={{float:'right',left:2}}>
                        <Switch onChange={changeView}/>
                    </div>
                </div>
               <div style={{width: "100%", height: "90%",overflow: "auto"}}>
                    <Itemsets buttonSwitch={this.viewSwitch} samples={this.props.samples} rules={this.props.rules} step={this.step} barWidth={this.barWidth} offsetX={this.offsetX} offset={this.offset}/>
               </div>
           </div>
           :<div className='itemset' style={{width: "100%", height: "70%",overflowY: "scroll"}}>
               <Row className='modelCompare'>
                <Col span={6}>
                    <div id='compareLeft'>
                        <Compared compFlag={1} samples={this.props.compSamples} rules={this.props.compRules} step={this.step} barWidth={this.barWidth} offsetX={this.offsetX} offset={this.offset}/>
                    </div>
                </Col>
                
                <Col span={18}>
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