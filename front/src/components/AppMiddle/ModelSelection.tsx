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
    compareFlag:boolean,
    onChangeXScaleMax:(xScaleMax:number)=>void,
    onChangeModel:(dataset:string,model:string) => void,
    onChangeCompModel:(dataset:string,model:string) => void,
    onChangeFoldFlag:(foldFlag:boolean) => void,
    onChangeCompareMode:(compareFlag:boolean)=>void,
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

    models: string[] = this.getModel(this.props.showDataset);
    // interval of different models' view
    intervalHeight = 0.7 * window.innerHeight / this.models.length
    // top start position 
    topStart = this.intervalHeight*0.2;
    // a standard reference length
    markSize = 14; 
    // line's color
    lineColor = 'rgb(204, 204, 204)';
    // color of unselected area (BAD_COLOR is the color of selected area)
    areaColor = 'rgb(232, 232, 232)';
    yScale:any[];
    yMax:number[] = [];
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

    getModel(dataset:string){
        if(dataset=='academic'){
            return ['xgb', 'knn', 'lr']
        }
        else if(dataset=='adult'){
            return ['xgb', 'knn', 'lr','svm','rf']
        }
        else if(dataset=='bank'){
            return ['xgb', 'knn', 'lr']
        }
        return null
    }

    updateModels(){
        this.models = this.getModel(this.props.showDataset)
        this.intervalHeight = 0.7 * window.innerHeight / this.models.length
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
        let {selectedModel,selectedCompModel} = this.state
        let axis:any[] = []
        this.yScale = []
        this.yMax = []
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
                let rightEnd = this.rightEnd;
                let intervalHeight = this.intervalHeight;
        
                // xScale maps risk_dif to actual svg pixel length along x-axis
                let xScale = d3.scaleLinear().domain([-maxAbsoluteX,maxAbsoluteX]).range([leftStart,this.rightEnd])
                // yScale maps risk_dif to actual svg pixel length along x-axis
                let yScale = d3.scaleLinear().domain([0,Math.max(...yMax)]).range([0,-intervalHeight*0.7])
                 // area of rules filtered by key_attrs
                let curveKeyAttrs = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>bottomEnd).y0(d=>bottomEnd+yScale(d.y)).curve(d3.curveMonotoneX)
                
                this.yScale.push(yScale)
                this.yMax.push(Math.max(...yMax))
                let changeModel = () => {
                    if(i!=selectedCompModel){
                        this.props.onChangeModel(this.props.showDataset,model)
                        this.setState({selectedModel:i})
                    }
                }

                let changeCompModel = () =>{
                    if(i!=selectedModel){
                        if(selectedCompModel==i){
                            if(this.props.compareFlag){
                                this.props.onChangeCompareMode(false)
                            }
                            this.setState({selectedCompModel:-1})
                        }else{
                            if(!this.props.compareFlag){
                                this.props.onChangeCompareMode(true)
                            }
                            this.props.onChangeCompModel(this.props.showDataset,model)
                            this.setState({selectedCompModel:i})
                        }
                    }
                }

                let startY = bottomEnd - intervalHeight *0.7

                let buttonPathLeft = `M${1.10*rightEnd},${startY + 0.01*bottomEnd+0.05*rightEnd} h${0.15*rightEnd} v${0.15*rightEnd} h${-0.15*rightEnd} a${0.05*rightEnd},${0.1*rightEnd} 0 0 1 0,${-0.15*rightEnd}`  

                let buttonPathRight = `M${1.25*rightEnd},${startY + 0.01*bottomEnd+0.05*rightEnd} h${0.15*rightEnd} a${0.05*rightEnd},${0.1*rightEnd} 0 0 1 0,${0.15*rightEnd}
                h${-0.15*rightEnd} v${-0.15*rightEnd}`
                let fontSize = 14
                axis.push(xScale)

                let button1Color = '#4d4d4d', button2Color = '#4d4d4d'
                if(selectedModel==i){
                    button1Color='#ff7f00'
                    button2Color='#d4d4d4'
                }
                if(selectedCompModel==i){
                    button2Color='#ff7f00'
                    button1Color='#d4d4d4'
                }
                return <g transform={`translate(0,${intervalHeight*(i+1)-bottomEnd})`} key={'multi_selection'+String(i)}id={'multi_models'} > 
                    <g>
                        <path d={curveKeyAttrs(dataKeyAttr_new[i])} style={{fill:lineColor}} className='overview'/>
                    
                        <path d={buttonPathLeft} style={{fill:'none',stroke:'#bbb',strokeWidth:1}}/>
                        <path d={buttonPathRight} style={{fill:'none',stroke:'#bbb',strokeWidth:1}}/>

                        <text fill={button2Color} fontSize={fontSize} x={1.15*rightEnd} y={startY + 0.01*bottomEnd+0.1*rightEnd+fontSize/2} >S</text>
                        <text fill={button1Color} fontSize={fontSize} x={1.31*rightEnd} y={startY + 0.01*bottomEnd+0.1*rightEnd+fontSize/2} >P</text>
                        <path d={buttonPathLeft} style={{fill:'transparent'}} onClick={changeCompModel} cursor={i!=this.state.selectedModel?'pointer':null}/>
                        <path d={buttonPathRight} style={{fill:'transparent'}} onClick={changeModel} cursor={i!=this.state.selectedCompModel?'pointer':null}/>

                        <text fill='#0e4b8e' x={this.rightEnd * 1.17} y={startY}>{this.models[i]}</text>

                        <text fill = '#0e4b8e' x={this.rightEnd*1.05} y={startY + 0.1*bottomEnd}>{'Acc:'+(this.props.accuracy[i]*100).toFixed(1)+'%'}</text>
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
                <path id="mask" d={mask} style={{strokeWidth:width*1.5,stroke:'transparent'}}><title>{fold?'Expand':'Fold'}</title></path>
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

            let yAxis = d3.axisRight(this.yScale[i])
            .tickValues([this.yMax[i]])

            d3.select(this.ref.current).append('g').attr('class','axisSelection').attr('id','axisY').attr('transform',`translate(${(this.state.fold?-this.rightEnd*1.4:0) + (this.rightEnd+this.leftStart)/2},${this.intervalHeight * (i+1)})`)
            .attr('stroke-width','1.5px').call(yAxis)
            } 
        d3.selectAll('#axisY .tick text').attr('transform','translate(-15,-7)')
        d3.selectAll('#axisY .tick line').attr('x2','12').attr('transform','translate(-6,0)')
    }
}