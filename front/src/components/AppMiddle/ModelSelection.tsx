import * as React from 'react';
import "./ModelSelection.css"
import * as d3 from 'd3'
import {curveData} from 'components/AppMiddle/Attributes'
import {Rule} from 'types';
import {filterRulesNoThreshold} from 'Helpers'

export interface Props{
    allRules: Rule[],
    keyAttrs: string[],
    ruleThreshold: number[],
    showDataset: string,
    onChangeRuleThreshold : (ruleThreshold:[number, number])=>void,
    onChangeModel:(dataset:string,model:string) => void
}
export interface State{
    transformXLeft: number,
    transformXRight: number,
    zeroAxis: number,
    xScaleReverse: d3.ScaleLinear<number, number>
    xScale: d3.ScaleLinear<number, number>
    inputLeft: boolean,
    inputRight: boolean,

    fold: boolean,
    models: string[],
    dataSet: string,
    selectionCurves: curveData[][],
}
export interface rules{
    rule: string[],
    risk_dif: number,
}

export default class modelSelection extends React.Component<Props,State>{
    // left start position of svg elements
    public leftStart = 20 ; 
    // right end position
    rightEnd = window.innerWidth * 0.1; 
    // bottom end position
    bottomEnd = 120; 
    // top start position 
    topStart = 40 ;
    // a standard reference length
    markSize = 14; 
    // interval of different models' view
    intervalHeight = 90;
    // line's color
    lineColor = 'rgb(204, 204, 204)';
    // color of unselected area (BAD_COLOR is the color of selected area)
    areaColor = 'rgb(232, 232, 232)'
    // counters for dragging
    xLeft = 0; 
    xRight = 0;
    private ref: React.RefObject<SVGGElement>;
    constructor(props:Props){
        super(props)
        this.ref = React.createRef()
        this.state={
            transformXLeft: null,
            transformXRight: null,
            zeroAxis:null,
            xScaleReverse:null,
            xScale:null,
            inputLeft: false,
            inputRight: false,
            fold: true,
            models: [],
            dataSet: null,
            selectionCurves: [],
        }
        this.initTransformX = this.initTransformX.bind(this)
        this.reverseFold = this.reverseFold.bind(this)
        this.updateModels = this.updateModels.bind(this)
    }
    public componentDidMount() { 
        this.renderAxis();
    }
    
    public componentDidUpdate() {
        this.renderAxis();
    }

    // initialize states
    initTransformX(transformXLeft:number,transformXRight:number,zeroAxis:number,xScale:d3.ScaleLinear<number, number>,xScaleReverse:d3.ScaleLinear<number, number>){
        this.setState({transformXLeft,transformXRight,zeroAxis,xScale,xScaleReverse})
        this.props.onChangeRuleThreshold([xScaleReverse(transformXLeft),xScaleReverse(transformXRight)])
        this.xLeft = transformXLeft; 
        this.xRight = transformXRight;
        this.setState({dataSet:this.props.showDataset})
        this.setState({models:this.props.showDataset=='academic'?['lr']:['xgb','knn','lr']})
    }

    // update state
    update(xScaleReverse:d3.ScaleLinear<number, number>,zeroAxis:number){
        this.setState({xScaleReverse})
        this.setState({zeroAxis})
    }

    // reverse selection column status
    reverseFold(){
        this.setState({fold:!this.state.fold})
    }

    
    updateModels(){
        this.setState({models:this.props.showDataset=='academic'?['lr']:['xgb','knn','lr']})
        this.setState({dataSet:this.props.showDataset})
    }

    modelSelection(){
        let axis:any[] = []
        return {path:<g id='overviewSelection'>
            {
            this.state.models.map((model,i)=>{
                let ruleIn = require('../../testdata/'+ this.props.showDataset + '_' + model + '_rules.json')
                let {keyAttrs} = this.props
                /**
                 * Processing rules by key attrs
                 *  */ 
                let rules = filterRulesNoThreshold(ruleIn, keyAttrs)
                let curveX:number[] = []
                let dataKeyAttr: curveData[] = []
                rules.forEach((rule,rule_i)=>{
                    if(!curveX.includes(rule['favorPD'])){
                        curveX.push(rule['favorPD'])
                        dataKeyAttr.push({x:rule['favorPD'],y:rule['sup_pnd'],z:0})
                    }else{
                        dataKeyAttr[curveX.indexOf(rule['favorPD'])].y += rule['sup_pnd']
                    }
                })
                let curveY:number[] = []
                curveX = []
                let step = Math.ceil(dataKeyAttr.length / 5)
                // console.log(dataKeyAttr.length,step)
                let stepCount = 0
                let dataKeyAttr_new:curveData[] = []
                dataKeyAttr.forEach((data,i)=>{
                    stepCount += data.y
                    if(((i%step==0))||(i==dataKeyAttr.length-1)){
                        data.y = stepCount
                        stepCount = 0
                        dataKeyAttr_new.push(data)
                        curveY.push(data.y)
                        curveX.push(data.x)
                    }
                })
                
                /**
                 * Draw area
                 * */ 
                // some parameters for drawing
                // bottom end position
                let bottomEnd = this.bottomEnd;
                // left start postition
                let leftStart = this.leftStart;
                // top start position 
                let topStart = this.topStart * 1.5
                // line's color
                let lineColor = this.lineColor;
                let intervalHeight = this.intervalHeight;
        
        
                // define scales
                let maxAbsoluteX = rules.length>0?Math.max.apply(null,curveX.map(Math.abs)):0.5
                // xScale maps risk_dif to actual svg pixel length along x-axis
                let xScale = d3.scaleLinear().domain([-maxAbsoluteX,maxAbsoluteX]).range([leftStart,window.innerWidth*0.1])
                // yScale maps risk_dif to actual svg pixel length along x-axis
                let yScale = d3.scaleLinear().domain([Math.min(...curveY),Math.max(...curveY)]).range([0,bottomEnd-topStart])
                 // area of rules filtered by key_attrs
                let curveKeyAttrs = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>bottomEnd).y0(d=>bottomEnd-yScale(d.y)).curve(d3.curveMonotoneX)
                
                let changeModel = () => {
                    this.props.onChangeModel(this.props.showDataset,model)
                }
                axis.push(xScale)
                return <g transform={`translate(0,${intervalHeight*(i+1)})`} id={'multi_models'}>
                        <path d={curveKeyAttrs(dataKeyAttr_new)} style={{fill:lineColor}} className='overview'/>

                        <foreignObject width={24} height={12} x={this.rightEnd * 1.15} y={this.bottomEnd*0.85} fontSize={9}>
                            <input type="radio" id={model} name="drone" value={model}  onClick={changeModel} />
                            <label>{model}</label>
                        </foreignObject>
                    </g>
            })
        }
        </g>
        ,
        axis:axis    
        }
    }

    switch(){
        let {fold} = this.state
        let transX = fold?this.leftStart/2:this.rightEnd*1.3,
            transY = this.bottomEnd+this.intervalHeight * 1.5,
            width = this.leftStart/2,
            height = this.intervalHeight
        
        let icon = d3.line<curveData>().x(d=>d.x).y(d=>d.y) 

        // the panel is folded
        let iconPoints = [{x:width/4,y:3/8*height,z:0},
                                {x:3/4*width,y:height/2,z:0},
                                {x:width/4,y:height*5/8,z:0}]

        // the panel is expanded
        let iconPointsReverse = [{x:width*3/4,y:3/8*height,z:0},
            {x:width/4,y:height/2,z:0},
            {x:width*3/4,y:height*5/8,z:0}]
                    
        return <g id={'switchOverview'} cursor='pointer' onClick={this.reverseFold} transform={`translate(${transX},${transY})`}>
                <rect width={width} height={height} 
                style={{fill:'#f0f0f0',stroke:'#d9d9d9'}}><title>{fold?'Expand':'Fold'}</title></rect>
                <path d={icon(fold?iconPoints:iconPointsReverse)} style={{stroke:'#969696',fill:'none'}}/>
            </g>
    }

    render(){
        
        if(this.state.dataSet!=this.props.showDataset){this.updateModels()}
        return <g key={'overviewOut'} ref={this.ref}>
                {this.state.fold?null:this.modelSelection().path}
                {this.switch()} 
        </g>
        // return <g>
        //     {this.ruleProcessing().dataKeyAttr.length>1?<g ref={this.ref}>
        //         {this.ruleProcessing().path}
        //     </g>:<text transform={`translate(0,${this.bottomEnd})`} fontSize={12}>Try different itemsets!</text>}
        // </g>
    }

    private renderAxis=()=>{
        if(!this.state.fold){
           for(var i=0;i<this.state.models.length;i++){
            let axis = d3.axisBottom(this.modelSelection().axis[i]).tickFormat(d3.format('.2f'))
            .tickValues(this.modelSelection().axis[i].ticks(1).concat(this.modelSelection().axis[i].domain()))
            d3.select(this.ref.current).append('g').attr('class','axis').attr('id','axisSelection').attr('transform',`translate(0,${this.bottomEnd + this.intervalHeight * (i+1)})`)
            .attr('stroke-width','1.5px').call(axis)
            } 
        }
        
        
    }
}