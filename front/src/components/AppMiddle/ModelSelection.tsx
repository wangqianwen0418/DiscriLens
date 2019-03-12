import * as React from 'react';
import "./ModelSelection.css"
import * as d3 from 'd3'
import {curveData} from 'components/AppMiddle/Attributes'
import {Rule} from 'types';
import {filterRulesNoThreshold} from 'Helpers'

export interface Props{
    allRules: Rule[],
    keyAttrNum: number,
    dragArray: string[],
    showDataset: string,
    accuracy:number[],
    onChangeXScaleMax:(xScaleMax:number)=>void,
    onChangeModel:(dataset:string,model:string) => void,
    onChangeCompModel:(dataset:string,model:string) => void,
    onChangeFoldFlag:(foldFlag:boolean) => void,
}
export interface State{
    fold: boolean,
    dataSet: string,
    selectionCurves: curveData[][],
    selectedModel: number,
    selectedCompModel: number,
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
    bottomEnd = window.innerHeight * 0.8; 
    // interval of different models' view
    intervalHeight = 150;
    // top start position 
    topStart = this.intervalHeight*0.2;
    // a standard reference length
    markSize = 14; 
    // line's color
    lineColor = 'rgb(204, 204, 204)';
    // color of unselected area (BAD_COLOR is the color of selected area)
    areaColor = 'rgb(232, 232, 232)';
    models: string[] = []
    private ref: React.RefObject<SVGGElement>;
    constructor(props:Props){
        super(props)
        this.ref = React.createRef()
        this.state={
            fold: false,
            dataSet: null,
            selectionCurves: [],
            selectedModel: 2,
            selectedCompModel: -1,
        }
        this.reverseFold = this.reverseFold.bind(this)
        this.updateModels = this.updateModels.bind(this)
    }
    public componentDidMount() { 
        this.renderAxisSelection();
    }
    
    public componentDidUpdate() {
        this.renderAxisSelection();
    }

    // reverse selection column status
    reverseFold(){
        this.setState({fold:!this.state.fold})
        this.props.onChangeFoldFlag(!this.state.fold)
    }

    
    updateModels(){
        this.models = ['xgb','knn','lr']
        this.setState({dataSet:this.props.showDataset})
    }

    changeXScaleMax(max:number){
        if(!this.state.fold){
            this.props.onChangeXScaleMax(max)
        }else{
            this.props.onChangeXScaleMax(-1)
        }
    }

    modelSelection(){
        let {dragArray,keyAttrNum} = this.props
        let axis:any[] = []
        let dataKeyAttr_new:curveData[][] = []
        let xMax = 0, yMax:number[] = []
        let ruleAvailable: boolean = false
        this.models.forEach((model,i)=>{
                let ruleIn = require('../../testdata/'+ this.props.showDataset + '_' + model + '_rules.json')
                /**
                 * Processing rules by key attrs
                 *  */ 
                let rules = filterRulesNoThreshold(ruleIn, dragArray.slice(0,keyAttrNum))
                if(rules.length>0){ruleAvailable=true}
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

                // sort samples points by risk_dif
                dataKeyAttr = dataKeyAttr.sort((a,b)=>{
                    return a.x - b.x
                })

                // down sampling to smooth data
                let curveY:number[] = []
                curveX = []
                let step = Math.ceil(dataKeyAttr.length / 5)
                let stepCount = 0
                dataKeyAttr_new.push([])
                dataKeyAttr.forEach((data,j)=>{
                    stepCount += data.y
                    if(((j%step==0))||(j==dataKeyAttr.length-1)){
                        data.y = stepCount
                        stepCount = 0
                        dataKeyAttr_new[i].push(data)
                        curveY.push(data.y)
                        curveX.push(data.x)
                    }
                })
                xMax = Math.max(xMax,Math.max.apply(null,curveX.map(Math.abs)))
                yMax.push(Math.max.apply(null,curveY.map(Math.abs)))
        })
        
        // define scales
        let maxAbsoluteX = ruleAvailable?xMax:0.5
        return {path:<g id='overviewSelection' transform={`translate(${this.state.fold?-this.rightEnd*1.5:0},0)`}>
            {
            this.models.map((model,i)=>{
                
                
                /**
                 * Draw area
                 * */ 
                // some parameters for drawing
                // bottom end position
                let bottomEnd = this.bottomEnd;
                // left start postition
                let leftStart = this.leftStart;
                // line's color
                let lineColor = this.lineColor;
                let intervalHeight = this.intervalHeight;
        
                // xScale maps risk_dif to actual svg pixel length along x-axis
                let xScale = d3.scaleLinear().domain([-maxAbsoluteX,maxAbsoluteX]).range([leftStart,this.rightEnd])
                // yScale maps risk_dif to actual svg pixel length along x-axis
                let yScale = d3.scaleLinear().domain([0,yMax[i]]).range([0,intervalHeight*0.7])
                 // area of rules filtered by key_attrs
                let curveKeyAttrs = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>bottomEnd).y0(d=>bottomEnd-yScale(d.y)).curve(d3.curveMonotoneX)
                
                let changeModel = () => {
                    this.props.onChangeModel(this.props.showDataset,model)
                    this.setState({selectedModel:i})
                }

                let changeCompModel = () =>{
                    this.props.onChangeCompModel(this.props.showDataset,model)
                    this.setState({selectedCompModel:i})
                }
                axis.push(xScale)
                return <g transform={`translate(0,${intervalHeight*(i+1)-bottomEnd})`} key={'multi_selection'+String(i)}id={'multi_models'} > 
                    <g onClick={changeModel} cursor='pointer'>
                        <path d={curveKeyAttrs(dataKeyAttr_new[i])} style={{fill:lineColor}} className='overview'/>
                        
                        <circle cx={this.rightEnd * 1.1} cy={bottomEnd*0.9 } r={6} style={{fill:'#f0f0f0',stroke:'#999'}} />
                        
                        {i==this.state.selectedModel?<circle cx={this.rightEnd * 1.1} cy={bottomEnd*0.9 } r={3} style={{fill:'black'}}/>:null}
                        
                        <text fill='#0e4b8e' x={this.rightEnd * 1.17} y={bottomEnd*0.9 + 3 }>{this.models[i]}</text>

                        <text fill = '#0e4b8e' x={this.rightEnd*1.05} y={bottomEnd*0.95}>{'Acc:'+this.props.accuracy[i]*100+'%'}</text>
                    </g>
                    <g onClick={changeCompModel} cursor='pointer'>
                        <circle cx={this.rightEnd * 1.4} cy={bottomEnd*0.9 } r={6} style={{fill:'#f0f0f0',stroke:'#999'}} />
                            
                        {i==this.state.selectedCompModel?<circle cx={this.rightEnd * 1.4} cy={bottomEnd*0.9 } r={3} style={{fill:'black'}}/>:null}
                    </g> 
                </g>
            })
        }
        </g>
        ,
        axis:axis,
        xMax:xMax
        }
    }

    switch(xMax:number){
        let {fold} = this.state
        let transX = fold?this.leftStart/2:this.rightEnd*1.5,
            transY = this.intervalHeight*this.models.length/2+this.topStart,
            width = this.leftStart/2,
            height = this.intervalHeight/8,
            cornerR = this.rightEnd * 0.1,
            buttonWidth = 5
        
        let line = d3.line<curveData>().x(d=>d.x).y(d=>d.y) 

        // the panel is folded
        let iconPoints = [{x:width/4,y:-1/2*height,z:0},
                                {x:3/4*width,y:0,z:0},
                                {x:width/4,y:height/2,z:0}]

        // the panel is expanded
        let iconPointsReverse = [{x:width*3/4,y:-1/2*height,z:0},
            {x:width/4,y:0,z:0},
            {x:width*3/4,y:height/2,z:0}]
        
        // update state
        this.changeXScaleMax(xMax)
        let clickButton = () =>{
            this.reverseFold()
        }
        // border
        let borderLine = `M${-this.rightEnd*1.5},${this.topStart} h${this.rightEnd*1.5-cornerR} a${cornerR},${cornerR} 0 0 1 ${cornerR},${cornerR} 
        v${(this.models.length-1/2)/2*this.intervalHeight - cornerR} l${buttonWidth*3},${buttonWidth} v${this.intervalHeight/2-buttonWidth*2}
        l${-buttonWidth*3},${buttonWidth} v${(this.models.length-1/2)/2*this.intervalHeight - cornerR}
        a${cornerR},${cornerR} 0 0 1 ${-cornerR},${cornerR} h${cornerR-this.rightEnd*1.5} `

        // mask
        let mask = `M${0},${this.intervalHeight*this.models.length/2} v${this.topStart*2}`
        return <g id={'switchOverview'} cursor='pointer' onClick={clickButton}  transform={`translate(${transX},${0})`}>
                <path id="mask" d={mask} style={{strokeWidth:width*2,stroke:'transparent'}}><title>{fold?'Expand':'Fold'}</title></path>
                <path d={borderLine} style={{fill:'none', stroke:'#d9d9d9', strokeWidth:'1px'}} />
                <path d={line(fold?iconPoints:iconPointsReverse)} style={{stroke:'#969696',fill:'none'}} transform={`translate(0,${transY})`}/>
            </g>
    }

    render(){
        if(this.state.dataSet!=this.props.showDataset){this.updateModels()}
        let modelSelection = this.modelSelection()
        return <g key={'overviewOut'} id="overviewOut" ref={this.ref}>
                {modelSelection.path}
                {this.switch(modelSelection.xMax)} 
        </g>
    }

    private renderAxisSelection=()=>{
        d3.selectAll('.axisSelection').remove()
        for(var i=0;i<this.models.length;i++){
            let axis = d3.axisBottom(this.modelSelection().axis[i]).tickFormat(d3.format('.2f'))
            .tickValues(this.modelSelection().axis[i].ticks(1).concat(this.modelSelection().axis[i].domain()))
            d3.select(this.ref.current).append('g').attr('class','axisSelection').attr('id','axisSelection').attr('transform',`translate(${this.state.fold?-this.rightEnd*1.4:0},${this.intervalHeight * (i+1)})`)
            .attr('stroke-width','1.5px').call(axis)
            } 
    }
}