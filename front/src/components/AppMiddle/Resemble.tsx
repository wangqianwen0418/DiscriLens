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
   compareFlag:boolean,
}

export default class AppMiddel extends React.Component<Props>{
    public step = 120;
    barWidth = this.step * 0.9;
    offsetX=50;
    viewSwitch = true;
    // divide number for curve
    divideNum = 10;
    render(){
        let changeView=()=>{
            this.viewSwitch = !this.viewSwitch
            this.setState({})
        }
        let switchX = this.props.foldFlag?window.innerWidth/4:window.innerWidth/5
        // alignment distance setting
        let leftWidth = window.innerWidth
        let offsetComp = window.innerWidth 
        if(this.props.foldFlag){
            leftWidth = 23 / 24 * leftWidth
            offsetComp = offsetComp * 23 / 24 / 4
        }else{
            leftWidth = 5 / 6 * leftWidth
            offsetComp = offsetComp * 5 /24
        }

        let offset = leftWidth * 0.25;
        

        return <Row className='App-middle'>

         <Col span={this.props.foldFlag?1:4} className='App-left' id='App-left' style={{height:"100%"}}>
           <svg className='modelSelection' style={{width:"100%", height:"100%"}}>
              <ModelSelection divideNum={this.divideNum}/>
           </svg>
         </Col>

         <Col span={this.props.foldFlag?23:20} className='App-right' style={{height:"100%"}}>
         <svg className='overview' style={{width:offset, height:"30%"}} >
             <Overview offset={offset} divideNum={this.divideNum}/>
         </svg>
         <svg className='attribute' style={{width:leftWidth-offset, height: "30%"}}>
               <Attributes step={this.step} barWidth={this.barWidth} offsetX={this.offsetX+(!this.props.compareFlag?0:offsetComp)} offset={offset} foldFlag={this.props.foldFlag} leftWidth={leftWidth}/>
           </svg>
           {!this.props.compareFlag?
           <div className='itemset' style={{width: "100%", height: "70%"}}>
                <div style={{width: "12%", height: "10%",position:'relative',left:switchX}}>
                    <text>View Switch</text>
                    
                    <div style={{float:'right',left:2}}>
                        <Switch onChange={changeView}/>
                    </div>
                </div>
               <div style={{width: "100%", height: "90%",overflow: "auto"}}>
                    <Itemsets buttonSwitch={this.viewSwitch} samples={this.props.samples} rules={this.props.rules} step={this.step} barWidth={this.barWidth} offset={offset+this.offsetX}/>
               </div>
           </div>
           :<div className='itemset' style={{width: "100%", height: "70%",overflowY: "scroll"}}>
               <Row className='modelCompare'>
                <Col span={6}>
                    <div id='compareLeft'>
                        <Compared samples={this.props.compSamples} rules={this.props.compRules} step={this.step} barWidth={this.barWidth} offset={offset}/>
                    </div>
                </Col>
                
                <Col span={18}>
                    <div style={{overflowX:'scroll'}} id='compareRight'>
                        <ComparePrime samples={this.props.samples} rules={this.props.rules} step={this.step} barWidth={this.barWidth} offset={offset+this.offsetX}/>
                    </div>
                </Col>
               </Row>
           </div>
            }
       </Col>
       </Row>
    }
}