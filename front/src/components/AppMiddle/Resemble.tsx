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
   causal:string[],
   dragArray:string[],
   keyAttrNum:number,
   protectedAttr:string,
   onChangeKeyAttrs:(keyAttrs:string[])=>void
}

export interface State {
    causalVisible: boolean
    selectionRect: any[]
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
            causalVisible: false,
            selectionRect: ['',0,0,0]
        }
    }
    stringTransfer(input:string){
        let firstCha = input[0],
        restCha = input.slice(1,input.length)
        if((input=='Gender')||(input=='Raisedhands')){
            return firstCha.toLowerCase() + restCha
        }else{
            return input
        }
    }

    drawGraph(causal:string[]){
        let nodeW = 80, nodeH = 20, margin =6
        let dag = new dagre.graphlib.Graph();
        let {protectedAttr,keyAttrNum,dragArray} = this.props
        let keyAttrs = dragArray.slice(0,keyAttrNum)

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
            dag.setNode(w, {label:w, width: nodeW, height: nodeH})
            dag.setNode(v, {label:v, width: nodeW, height: nodeH})
            dag.setEdge(w, v)
        }

        dagre.layout(dag)

        const getInter = (p1: Point, p2: Point, n: number) => {
            return `${p1.x * n + p2.x * (1 - n)} ${p1.y * n + p2.y * (1 - n)}`
        }

        const getCurve = (points: Point[],longFlagStart:boolean,longFlagEnd:boolean) => {
            let vias = [],
                len = points.length;
            const ratio = 0.5
            for (let i = 0; i < len - 2; i++) {
                let p1, p2, p3, p4, p5;
                if (i === 0) {
                    if(longFlagStart){
                        p1 = `${points[i].x} ${points[i].y+nodeH/4}`
                    }else{
                        p1 = `${points[i].x} ${points[i].y}`
                    }
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
                if(longFlagEnd){
                    p5 = String(parseInt(p5) - nodeH/4)
                }
                let cPath = `M ${p1} L${p2} Q${p3} ${p4} L${p5}`
                vias.push(cPath)

            }
            return vias
        }
        
        let longStrings:string[] = []

        let nodes = <g className='causal nodes'>{
            
            dag.nodes()
            .map(v=>{
                let node = dag.node(v)
                let color = 'grey'
                let content = node.label.split('-')[0]
                if(keyAttrs.includes(this.stringTransfer(content))){
                    color = '#ff4d4f'
                }else if (protectedAttr==content.toLowerCase()){
                    color='#40a9ff'
                }

                let textWidth = 0
                let textFront = content
                let textEnd = null
                let rectHeight = nodeH
                let multiFlag = false
                textWidth = content.length * 5
                if(textWidth>nodeW*0.8){
                    longStrings.push(content)
                    rectHeight = 1.5 * rectHeight
                    textFront = content.slice(0,Math.floor(content.length/2))
                    textEnd = content.slice(Math.floor(content.length/2),content.length)
                    content = [textFront,textEnd]
                    multiFlag = true
                }
                let chooseKey=()=>{
                    if(content!='class'){
                         this.setState({selectionRect:[this.stringTransfer(node.label.split('-')[0])
                        ,nodeW/2+node.x,-rectHeight/2+node.y,rectHeight]})
                    }
                }
                // let leaveKey=()=>{
                //     this.setState({selectionRect:['',0,0,0]})
                // }
                return <g 
                    key={node.label} className='node'
                    transform={`translate(${node.x}, ${node.y})`}
                >   
                    {!multiFlag?
                        <text fill={color} textAnchor='middle' y={rectHeight*0.2}>{content}</text>:
                        <g>
                            <text textAnchor='middle' fill={color} y={-rectHeight*0.1+2}>
                                {content[0]}
                            </text>
                            <text textAnchor='middle' fill={color} y={-rectHeight*0.1+14}>
                                {content[1]}
                            </text>
                        </g>
                    }

                    {/* <rect   
                        x={-nodeW/2-5} y={-rectHeight/2-5} width={nodeW+10} height={rectHeight+10}
                        stroke='none'
                        rx={4}
                        ry={4}
                        fill='transparent'
                        onMouseLeave={leaveKey}
                    /> */}
                    
                    <rect   
                        x={-nodeW/2} y={-rectHeight/2} width={nodeW} height={rectHeight}
                        stroke='#999'
                        rx={4}
                        ry={4}
                        fill={content=='class'?'#bbb':'transparent'}
                        onMouseEnter={chooseKey}
                    />

                    {content=='class'?
                    <text fill={'white'} textAnchor='middle' y={rectHeight*0.2}>{content}</text>
                    :null}
                    
                </g>
            })
        }</g>
        let edges = <g className='causal edges'>{
            dag.edges()
            .map((e,i)=>{
                let {points} = dag.edge(e)
                let longFlagStart = false,
                longFlagEnd = false
                if(longStrings.includes(e.v)){
                    longFlagStart = true
                }
                if(longStrings.includes(e.w)){
                    longFlagEnd = true
                }
                let vias = getCurve(points,longFlagStart,longFlagEnd), start = `M ${points[0].x} ${points[0].y}`

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
            offsetComp = offsetComp * 23 / 24 /24*5
        }else{
            leftWidth = 5 / 6 * leftWidth
            offsetComp = offsetComp * 5 /6/24*5
        }

        let offset = leftWidth * 0.25;

        let compOffset = leftWidth / 24*5
    
        let leftAppSpan = this.props.foldFlag?23:20 //
        let upAppHeight = 30 // [0, 100] height of the attribute row

        let {protectedAttr,keyAttrNum,dragArray} = this.props
        let keyAttrs = dragArray.slice(0,keyAttrNum)

        let includeText = 0
        if(keyAttrs.includes(this.state.selectionRect[0])){
            includeText = 1
        }

        if(this.state.selectionRect[0].toLowerCase()==protectedAttr){
            includeText = 2
        }

        let leaveKey=()=>{
            if(this.state.selectionRect[0]){
                this.setState({selectionRect:['',0,0,0]})
            }
        }

        let keyChange=()=>{
            let newKeyAttrs = keyAttrs
             if(newKeyAttrs.indexOf(this.state.selectionRect[0])!=-1){
                newKeyAttrs.splice(newKeyAttrs.indexOf(this.state.selectionRect[0]),1)
                this.props.onChangeKeyAttrs(newKeyAttrs)
            }else{
                newKeyAttrs.push(this.state.selectionRect[0])
                this.props.onChangeKeyAttrs(newKeyAttrs)
            }
            
        }

        let legend=()=>{
            return <g transform={`translate(${0},${0})`}>
                <rect width={10} height={10} fill='#40a9ff'/>
                <text fontSize={10} x={12} y={10}>Protected attribute</text>
                <rect width={10} height={10} y={12} fill='#ff4d4f'/>
                <text fontSize={10} x={12} y={21}>Key attributes</text>
            </g>
        }

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
               <Attributes step={this.step} barWidth={this.barWidth} offsetX={!this.props.compareFlag?(this.offsetX):(offsetComp-offset/4)} offset={offset} foldFlag={this.props.foldFlag} leftWidth={leftWidth}/>
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
                <Col span={5}>
                    <div id='compareLeft'>
                        <Compared samples={this.props.compSamples} rules={this.props.compRules} step={this.step} barWidth={this.barWidth} offset={compOffset}/>
                    </div>
                </Col>
                
                <Col span={19}>
                    <div style={{overflowX:'scroll'}} id='compareRight'>
                        <ComparePrime samples={this.props.samples} rules={this.props.rules} step={this.step} barWidth={this.barWidth} offset={offset}/>
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
        {this.state.selectionRect[0]?
        <div style={{position:'absolute',left:this.state.selectionRect[1]+25,top:this.state.selectionRect[2]
            +25+(height+50)/3+this.state.selectionRect[3]/2-12}}>

            <Button className={'protectedButton'} icon={includeText==2?'check':'close'}  size='small' type={includeText==2?'primary':null} ghost={includeText==2?true:false}></Button>

            <Button className={'KeyButton'} icon={includeText==1?'check':'close'}  size='small'
            onClick={keyChange} type={includeText==1?'danger':null} ghost={includeText==1?true:false}></Button>
        </div>:null}
        <svg  className='causal model' style={{width:width, height: height}}>
            <rect onMouseEnter={leaveKey} fill={'transparent'} x={0} y={0} width={width+50} height={height}/>
            {nodes}
            {edges}
            {legend()}
        </svg>
        </Modal>
       </Row>
    }
}