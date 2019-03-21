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
    accuracy:{[key:string]:number},
    compareFlag:boolean,
    divideNum:number
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
    compareFlag:boolean,
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
    // bottom end position, the height of top bar is 50
    bottomEnd = (window.innerHeight-50) * 0.8; 

    models: string[] = this.getModel(this.props.showDataset);
    // top start position 
    topStart = 0//this.intervalHeight*0.2;
    // interval of different models' view
    intervalHeight = (this.bottomEnd-20) / this.models.length
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
            compareFlag:false,
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
            return ['xgb', 'knn', 'lr','knn_post1','rf','dt']
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
        this.intervalHeight = (this.bottomEnd-20) / this.models.length
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
        let {selectedModel,selectedCompModel,compareFlag} = this.state
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

                // let xMaxTemp = dataKeyAttr[dataKeyAttr.length-1].x,
                // xMinTemp = dataKeyAttr[0].x
                // down sampling to smooth curve
                let curveY:number[] = []
                curveX = []
                // let divideNum = this.props.divideNum
                // let step = (xMaxTemp-xMinTemp)/divideNum
                // let stepCount = 0
                // let dataCount = 0
                dataKeyAttr_new.push([])
                dataKeyAttr.forEach((data)=>{
                // for(var j=0;j<divideNum;j++){
                //     let xLower = xMinTemp + step*j,
                //     xHigher = Math.min(xMinTemp + step*(j+1),xMaxTemp),
                //     startX = dataKeyAttr[dataCount].x
                //     while((dataKeyAttr[dataCount].x>=xLower)&&(dataKeyAttr[dataCount].x<=xHigher)&&(dataCount<dataKeyAttr.length-1))
                //     {   
                //         stepCount += dataKeyAttr[dataCount].y
                //         if(dataCount<dataKeyAttr.length-1){dataCount += 1}
                //     }
                //     let data:curveData={x:startX,y:stepCount,z:0}
                //     stepCount = 0
                    dataKeyAttr_new[i].push(data)
                    curveY.push(data.y)
                    curveX.push(data.x)
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
                let leftStart = this.leftStart;
                // let rightEnd = this.rightEnd;
                let intervalHeight = this.intervalHeight;
                // xScale maps risk_dif to actual svg pixel length along x-axis
                let xScale = d3.scaleLinear().domain([-maxAbsoluteX,maxAbsoluteX]).range([leftStart,this.rightEnd])
                // yScale maps risk_dif to actual svg pixel length along x-axis
                let yScale = d3.scaleLinear().domain([0,Math.max(...yMax)]).range([0,-intervalHeight*0.7])
                this.yScale.push(yScale)
                this.yMax.push(Math.max(...yMax))

                let changeModel = () => {
                    let newState:boolean = compareFlag
                    if(i==selectedModel){
                        newState = !compareFlag
                    }
                    
                    if(newState){
                        if(i!=selectedModel&&i!=selectedCompModel){
                            this.props.onChangeCompareMode(true)
                            this.props.onChangeCompModel(this.props.showDataset,model)
                            this.setState({selectedCompModel:i})
                        }
                    }else{
                        if(selectedCompModel!=-1){
                            this.props.onChangeCompareMode(false)
                            // this.props.onChangeCompModel('','')
                            this.setState({selectedCompModel:-1})
                        }
                        if(i!=selectedModel){
                            this.props.onChangeModel(this.props.showDataset,model)
                            this.setState({selectedModel:i})
                        }
                    }
                    this.setState({compareFlag:newState})
                }

                // let changeCompModel = () =>{
                //     if(i!=selectedModel){
                //         if(selectedCompModel==i){
                //             if(this.props.compareFlag){
                //                 this.props.onChangeCompareMode(false)
                //             }
                //             this.setState({selectedCompModel:-1})
                //         }else{
                //             if(!this.props.compareFlag){
                //                 this.props.onChangeCompareMode(true)
                //             }
                //             this.props.onChangeCompModel(this.props.showDataset,model)
                //             this.setState({selectedCompModel:i})
                //         }
                //     }
                // }

                let startY = 0
                axis.push(xScale)
                let widthText = 0
                if(document.getElementById(`text${this.models[i]}`)){
                    widthText = document.getElementById(`text${this.models[i]}`).getClientRects()[0].width
                }
                
                let rectX = this.rightEnd * 1.25-(widthText+10)/2,
                rectY = -0.5 * intervalHeight

                let lineColor = '#999', textColor='#999'
                if((selectedModel==i)&&(!compareFlag)){
                    lineColor = '#1890ff'
                    textColor = '#1890ff'
                }
                if((selectedModel==i)&&(compareFlag)){
                    lineColor = '#bbb'
                    textColor = 'white'
                }
                if(selectedCompModel==i){
                    lineColor = '#1890ff'
                    textColor = '#1890ff'
                }

                return <g transform={`translate(0,${intervalHeight*(i+1)})`} key={'multi_selection'+String(i)}id={'multi_models'} > 
                    <g>
                        {dataKeyAttr_new[i].map((data,i)=>{
                                let color = '#bbb'
                                return <circle cx={xScale(data.x)} cy={yScale(data.y)} r={3} 
                                style={{fill:'none',stroke:color,strokeWidth:2}} className='overview'/>
                        })}
                        {(selectedModel==i&&compareFlag)?<rect rx={3} ry={3} x={rectX} y={rectY} width={widthText+10} height={20} 
                            style={{fill:'#1890ff',stroke:lineColor,strokeWidth:1}}></rect>:null}
                        <text id={'text'+this.models[i]} fill={textColor} x={this.rightEnd * 1.25-widthText/2} y={startY-0.35*intervalHeight}>{this.models[i]}</text>
                        <rect rx={3} ry={3} x={rectX} y={rectY} width={widthText+10} height={20} 
                            style={{fill:'transparent',stroke:lineColor,strokeWidth:1}}
                            onClick={changeModel} cursor={'pointer'}/>
                        <text fill={'#0e4b8e'} x={this.rightEnd*1.05} y={startY - 0.15*intervalHeight}>{'Acc:'+(this.props.accuracy[this.models[i]]*100).toFixed(1)+'%'}</text>
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
            width = this.leftStart/2,
            height = this.intervalHeight/8,
            transY = this.bottomEnd/2-height/2,
            // cornerR = this.rightEnd * 0.1,
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

        let buttonHeight = 1/12*window.innerHeight
        // border
        // a${cornerR},${cornerR} 0 0 1 ${cornerR},${cornerR}
        let borderLine = `M${0},${this.topStart}
        v${this.bottomEnd/2-buttonHeight/8*5} l${buttonWidth*3},${buttonHeight/8} v${buttonHeight}
        l${-buttonWidth*3},${buttonHeight/8} v${this.bottomEnd/2-buttonHeight/8*5}
        `
        // mask
        let mask = `M${1.5*buttonWidth},${this.topStart+this.bottomEnd/2-buttonHeight/8*5} v${buttonHeight}`
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

            d3.select(this.ref.current).append('g').attr('class','axisSelection').attr('id','axisYM').attr('transform',`translate(${(this.state.fold?-this.rightEnd*1.4:0) + (this.rightEnd+this.leftStart)/2},${this.intervalHeight * (i+1)})`)
            .attr('stroke-width','1.5px').call(yAxis)
            } 
        d3.selectAll('#axisYM .tick text').attr('transform','translate(-15,-5)')
        d3.selectAll('#axisYM .tick line').attr('x2','12').attr('transform','translate(-6,0)')
    }
}