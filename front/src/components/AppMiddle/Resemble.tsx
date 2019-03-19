import * as React from 'react';
import Attributes from 'containers/Attributes';
import Itemsets from 'containers/Itemsets';
import Overview from 'containers/Overview';
import ModelSelection from 'containers/ModelSelection';
import Compared from 'containers/Compared';
import ComparePrime from 'containers/ComparePrime'
import {Col, Row, Switch, Modal, Button} from 'antd';
import {DataItem,Rule} from 'types';
import * as dagre from 'dagre';

// import * as causal from 'testdata/academic_key.json'


export interface Props{
   foldFlag:boolean,
   compSamples:DataItem[],
   rules:Rule[],
   samples:DataItem[],
   compRules:Rule[],
   compareFlag:boolean,
   causal:string[]
}

export interface State {
    causalVisible: boolean
}

export interface Point{
    x:number,
    y:number
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
    drawGraph(causal:string[]){
        let nodeW = 75, nodeH = 20, margin =6
        let dag = new dagre.graphlib.Graph();

        dag.setGraph({
            ranksep: nodeH,
            marginx: margin,
            marginy: margin,
            rankdir: 'TB',
            edgesep: nodeH,
            nodesep: nodeW,
            ranker: "tight-tree"
            // ranker: 'longest-path'
        });
        dag.setDefaultEdgeLabel(() => { return {}; });
        for (let edge of causal){
            let [w, v] = edge.split(' --> ')
            console.info(w, v)
            dag.setNode(w, {label:w, width: nodeW, height: nodeH})
            dag.setNode(v, {label:v, width: nodeW, height: nodeH})
            dag.setEdge(w, v)
        }

        dagre.layout(dag)

        const getInter = (p1: Point, p2: Point, n: number) => {
            return `${p1.x * n + p2.x * (1 - n)} ${p1.y * n + p2.y * (1 - n)}`
        }

        const getCurve = (points: Point[]) => {
            let vias = [],
                len = points.length;
            const ratio = 0.5
            for (let i = 0; i < len - 2; i++) {
                let p1, p2, p3, p4, p5;
                if (i === 0) {
                    p1 = `${points[i].x} ${points[i].y}`
                } else {
                    p1 = getInter(points[i], points[i + 1], ratio)
                }
                p2 = getInter(points[i], points[i + 1], 1 - ratio)
                p3 = `${points[i + 1].x} ${points[i + 1].y}`
                p4 = getInter(points[i + 1], points[i + 2], ratio)
                if (i === len - 3) {
                    p5 = `${points[i + 2].x} ${points[i + 2].y}`
                } else {
                    p5 = getInter(points[i + 1], points[i + 2], 1 - ratio)
                }

                let cPath = `M ${p1} L${p2} Q${p3} ${p4} L${p5}`
                vias.push(cPath)

            }
            return vias
        }
        

        let nodes = <g className='causal nodes'>{
            dag.nodes()
            .map(v=>{
                let node = dag.node(v)
                return <g 
                    key={node.label} className='node'
                    transform={`translate(${node.x}, ${node.y})`}
                >
                    <rect   
                        x={-nodeW/2} y={-nodeH/2} width={nodeW} height={nodeH}
                        stroke='grey'
                        fill='white'
                    />
                    <text textAnchor='middle' y={nodeH*0.2}>{node.label.split('-')[0]}</text>
                </g>
            })
        }</g>

        let edges = <g className='causal edges'>{
            dag.edges()
            .map((e,i)=>{
                let {points} = dag.edge(e)
                let vias = getCurve(points), start = `M ${points[0].x} ${points[0].y}`

            let pathData = `${start}  ${vias.join(' ')}`
                return <path 
                    key={i} 
                    className='node' 
                    d={pathData}
                    fill='none'
                    stroke='grey'
                />
            })
        }</g>

        let {width, height}=dag.graph() 
        return {nodes, edges, width, height}
    }
    render(){
        let {nodes, edges, width, height} = this.drawGraph(this.props.causal)
        
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

        let compOffset = leftWidth / 3
        
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
                <Col span={8}>
                    <div id='compareLeft'>
                        <Compared samples={this.props.compSamples} rules={this.props.compRules} step={this.step} barWidth={this.barWidth} offset={compOffset}/>
                    </div>
                </Col>
                
                <Col span={16}>
                    <div style={{overflowX:'scroll'}} id='compareRight'>
                        <ComparePrime samples={this.props.samples} rules={this.props.rules} step={this.step} barWidth={this.barWidth} offset={2*offset-compOffset+this.offsetX}/>
                    </div>
                </Col>
               </Row>
           </div>
            }
       </Col>
       <Modal
          title="Causal Graph"
          visible={this.state.causalVisible}
          width={width+50}
        //   onOk={this.handleOk}
          // tslint:disable-next-line:jsx-no-lambda
          onCancel={e=>this.setState({causalVisible:false})}
          footer={null}
        >
        <svg className='causal model' style={{width:width, height: height}}>
        {nodes}
        {edges}
        </svg>
        </Modal>
       </Row>
    }
}