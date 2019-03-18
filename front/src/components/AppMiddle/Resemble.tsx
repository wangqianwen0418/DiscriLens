import * as React from 'react';
import Attributes from 'containers/Attributes';
import Itemsets from 'containers/Itemsets';
import Overview from 'containers/Overview';
import ModelSelection from 'containers/ModelSelection';
import Compared from 'containers/Compared';
import ComparePrime from 'containers/ComparePrime'
import {Col, Row, Switch, Modal, Button} from 'antd';
import {DataItem,Rule} from 'types';

import * as causal from 'testdata/academic_key.json'


export interface Props{
   foldFlag:boolean,
   compSamples:DataItem[],
   rules:Rule[],
   samples:DataItem[],
   compRules:Rule[],
   compareFlag:boolean,
}

export interface State {
    causalVisible: boolean
}

export default class AppMiddel extends React.Component<Props, State>{
    public step = 120;
    barWidth = this.step * 0.9;
    offsetX=50;
    viewSwitch = true;
    // divide number for curve
    divideNum = 10;
    constructor(props:Props){
        super(props)
        this.state={
            causalVisible: false
        }
    }
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
        let leftAppSpan = this.props.foldFlag?23:20 //
        let upAppHeight = 25 // [0, 100] height of the attribute row

        return <Row className='App-middle'>

         <Col span={this.props.foldFlag?1:4} className='App-left' id='App-left' style={{height:"100%"}}>
           <svg className='modelSelection' style={{width:"100%", height:"100%"}}>
              <ModelSelection divideNum={this.divideNum}/>
           </svg>
         </Col>

         <Col span={leftAppSpan} className='App-right' style={{height:"100%"}}>
         <svg className='overview' style={{width:offset, height: upAppHeight+"%"}} >
             <Overview offset={offset} divideNum={this.divideNum}/>
         </svg>
         
         <svg className='attribute' style={{width:leftWidth-offset, height: upAppHeight+"%"}}>
               <Attributes step={this.step} barWidth={this.barWidth} offsetX={this.offsetX+(!this.props.compareFlag?0:offsetComp)} offset={offset} foldFlag={this.props.foldFlag} leftWidth={leftWidth}/>
           </svg>
           {!this.props.compareFlag?
           <div className='itemset' style={{width: "100%", height: (100-upAppHeight)+"%"}}>
                <div style={{position:'absolute',left:switchX}} className='view_controller'>
                    {/* View Mode */}
                    <Switch  style={{float:'left',right:10, top: 6}} onChange={changeView} checkedChildren="parallel" unCheckedChildren="compact"/>
                    <Button 
                     icon="setting" 
                    style={{float:'left'}}
                    // tslint:disable-next-line:jsx-no-lambda
                    onClick={(e:React.MouseEvent)=>this.setState({causalVisible:true})}
                    />
                    {/* <Icon 
                        type="eye" 
                        style={{width:'2em', height:'2em', float:'left'}}
                        // style={{float:'right',left:2}}
                        //  style={{position:'absolute', left: window.innerWidth*(leftAppSpan)/24+offset}}
                        // tslint:disable-next-line:jsx-no-lambda
                        onClick={e=>this.setState({causalVisible:true})}
                    /> */}
                </div>
               <div style={{width: "100%", height: "90%",overflow: "auto"}}>
                    <Itemsets buttonSwitch={this.viewSwitch} samples={this.props.samples} rules={this.props.rules} step={this.step} barWidth={this.barWidth} offset={offset+this.offsetX}/>
               </div>
           </div>
           :<div className='itemset' style={{width: "100%", height: (100-upAppHeight)+"%",overflowY: "scroll"}}>
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
       <Modal
          title="Causal Graph"
          visible={this.state.causalVisible}
        //   onOk={this.handleOk}
          // tslint:disable-next-line:jsx-no-lambda
          onCancel={e=>this.setState({causalVisible:false})}
          footer={null}
        >
        <svg className=''/>
          {causal.causal}
        </Modal>
       </Row>
    }
}