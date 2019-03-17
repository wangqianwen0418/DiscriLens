
// import {
//     BubbleSet,
//     PointPath,
//     ShapeSimplifier,
//     BSplineShapeGenerator
// } from 'lib/bubble.js';
import * as React from 'react';
// import { RuleAgg, RuleNode} from 'Helpers';
import { RuleAgg, RuleNode, getMinLinks, boundaryColor} from 'Helpers';
import { Rule, DataItem } from 'types';
import './BubblePack.css';
import {packEnclose, graphPack} from 'lib/pack/index.js';


// import * as d3 from 'd3';

export interface Props {
    ruleAgg: RuleAgg,
    // scoreScale: d3.ScaleLinear<number, number>,
    scoreColor: (score: number) => string,
    showIDs: string[],
    hoverRule: string,
    highlightRules: string[],
    samples: DataItem[],
    protectedVal: string
}
export interface State {

}



export interface ItemHierarchy {
    id: string,
    children: ItemHierarchy[],
    score: number | null,
    groups: string[],
    [key:string]: any
}
// export interface SetData {
//     sets: string[],
//     label: string,
//     size: number,
//     score: number
//     [key: string]: any
// }
const flatten = (nodes: RuleNode[]): Rule[] => {
    let rules: Rule[] = []
    for (let node of nodes) {
        if(!rules.map(rule=>rule.id).includes(node.rule.id)){
            rules.push(node.rule)
        }
        if (node.children.length > 0) {
            rules = rules.concat(
                flatten(node.children)
                .filter(
                    rule=>!rules.map(rule=>rule.id).includes(rule.id)
                )
            )
        }
    }
    return rules
}

const extractItems = (rules: Rule[]): { id: any, score: number, groups: string[] }[] => {
    let itemSet: { id: any, score: number, groups: string[] }[] = []
    for (let rule of rules) {
        for (let item of rule.items) {
            let idx = itemSet
                .map(d => d.id)
                .indexOf(item)
            if (idx > -1) {
                itemSet[idx].score = Math.abs(itemSet[idx].score)>Math.abs(rule.risk_dif)?itemSet[idx].score: rule.risk_dif
                if(!itemSet[idx].groups.includes(rule.id.toString())){
                    itemSet[idx].groups.push(rule.id.toString())
                }

            } else {
                itemSet.push({
                    id: item,
                    score: rule.risk_dif, // score, get the absolute value
                    groups: [rule.id.toString()]
                })
            }
        }
    }
    
    // itemSet.sort((a, b) => a.score - b.score)
    // // console.info('sort score', itemSet)
    // itemSet.sort(
    //         (a,b) => b.groups.length - a.groups.length
    //         )
    // console.info('sort group', itemSet)
    return itemSet
}

export default class Bubble extends React.Component<Props, State>{
    width=100; height=100;  radius=4; circlePadding=0;ref: React.RefObject<SVGAElement>=React.createRef();
    constructor(props: Props){
        super(props)
    }
    getSize(){
        // return [this.width+this.circlePadding,  this.height+this.circlePadding]
        let box = this.ref.current.getBoundingClientRect()
        return [box.width, box.height]
    }
    componentWillReceiveProps(props: Props){
        // console.info(props)
    }
    shouldComponentUpdate(nextProps:Props){
        if((nextProps.ruleAgg.id == this.props.ruleAgg.id)&&(this.props.hoverRule==nextProps.hoverRule))
        {
            return false
        }
        return true
    }
    draw(){
        let { ruleAgg, scoreColor, hoverRule, highlightRules, samples } = this.props
        // let rules = flatten(ruleAgg.nodes).sort((a,b)=>a.score-b.score),
        let rules = flatten(ruleAgg.nodes),
            items = extractItems(rules),
        circlePadding = this.radius*(highlightRules.length)*1.5 // change circle padding based on the highlight boundaries
        this.circlePadding = circlePadding

        // console.info(hoverRule)

        // cluster item circles to a big circle
        // let clusteredItems = groupByKey(items, (item)=>[item.score, item.groups.length])
       
        // store the position of circles

        let root: ItemHierarchy = {
            id: 'root',
            children: [],
            groups: [],
            score: null
        }
        let  childDict:any = []

        items.forEach((item) => {
            let currentGroup = item.groups.sort().join(',')
            
            // let prevItem = items[itemIdx - 1], prevGroup = prevItem.groups.sort().join(',')
            if (!childDict.includes(currentGroup)) {
                root.children.push({
                    // id: 'rules_' + currentGroup,
                    id: `itemcluster_${root.children.length}`,
                    groups: item.groups,
                    score: item.score,
                    children: [{
                        id: item.id,
                        score: item.score,
                        groups: item.groups,
                        children: [],
                    }]
                })
                childDict.push(currentGroup)
            } else {
                let childID = childDict.indexOf(currentGroup)
                root.children[childID].children.push({
                    id: item.id,
                    score: item.score,
                    groups: item.groups,
                    children: []
                })
            }
        })
        

        let graph = getMinLinks(rules, root.children)
        // pack items circles, using default 
        root.children
        .forEach((outerCircle: ItemHierarchy)=>{
            outerCircle.children
            .forEach((innerCircle:ItemHierarchy)=>{
                innerCircle.r = this.radius
            })
            outerCircle.r = packEnclose(outerCircle.children) + circlePadding/2
        })
        // pack subset circles, using modified packing
        // this.height = this.width = 2*packEnclose(root.children)
        this.height = this.width = 2*graphPack(root.children, graph)

        // update the x,y of children items
        root.children
        .forEach((outerCircle: ItemHierarchy)=>{
            outerCircle.x += this.width/2
            outerCircle.y += this.height/2
            outerCircle.children
            .forEach((innerCircle:ItemHierarchy)=>{
                innerCircle.x += outerCircle.x
                innerCircle.y += outerCircle.y
            })
        })

        

        let itemCircles: JSX.Element[] = []
        let highlightCircles: {[id:string]: ItemHierarchy[]} = {}
        highlightRules.forEach(ruleID=>{
            highlightCircles[ruleID] = []
        })
        let itemsPos: any[] = []
        let strokeWidth = 2

        // console.info(datum.children.map((d:any)=>d.data.score), hoverRule)

        root.children.forEach((outerCircle:ItemHierarchy) => {
            let scoreColor_ = scoreColor(outerCircle.score)
            let isHover = outerCircle.groups.includes(hoverRule)
            // let isHighlight = containsAttr(set.data.id, highlightRules).length>0
            let strokeColor = hoverRule==undefined?scoreColor_:(isHover?scoreColor_:'#ccc')
            let opacity = hoverRule==undefined?1:(isHover?1:0.2)


            


            highlightRules.forEach(ruleID=>{
                if(outerCircle.groups.includes(ruleID)){
                    highlightCircles[ruleID].push(
                        outerCircle
                    )
                }
            })
            
            itemCircles.push(<circle
                className='outer bubbles'
                key={outerCircle.id}
                id={outerCircle.id}
                transform={`translate(${outerCircle.x}, ${outerCircle.y})`}
                // cx={set.x}
                // cy={set.y}
                r={outerCircle.r-0.5*circlePadding}
                // fill={scoreColor}
                fill="white"
                // opacity='0.5'
                stroke={strokeColor}
                // fill="transparent"
                // stroke={set.data.id.includes(hoverRule)?"#b9b9b9":"#FF9F1E"}
                // strokeWidth={ (isHighlight ? 2*strokeWidth : strokeWidth)/this.scaleRatio }
                strokeWidth={strokeWidth}
            />)
            outerCircle.children.forEach((innerCircle: ItemHierarchy) => {
                // this.scaleRatio = (this.radius+strokeWidth/2)/innerCircle.r
                // itemsPos.push({
                //     x: item.x,
                //     y: item.y,
                //     r: item.r*0.9,
                //     ...item.data
                // })
                itemsPos.push(innerCircle)
                let id = innerCircle.id
                let sample = samples[id]
                let [protectedAttr, protectedVal] = this.props.protectedVal.split('=')
                let isProtect = sample[protectedAttr]==protectedVal
                // let itemColor = isProtect?COLORS[1]: COLORS[0]
                // let itemColor ="#b9b9b9"
                let itemColor = strokeColor
                let itemCircle = isProtect? <circle
                    className='inner bubbles'
                    key={id} 
                    // cx={innerCircle.x} cy={innerCircle.y} 
                    transform={`translate(${innerCircle.x}, ${innerCircle.y})`}
                    r={innerCircle.r*0.8 }
                    fill={sample.class=="1"?itemColor :'white'}
                    stroke={itemColor}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    // fill={d3.interpolateOranges(scoreScale(innerCircle.data.score))}
                    // fill="#FF9F1E"
                    // opacity={scoreScale(innerCircle.data.score)}
                />
                :<rect
                    className='inner bubbles'
                    key={id} 
                    fill={sample.class=="1"?itemColor :'white'}
                    stroke={itemColor}
                    strokeWidth={strokeWidth}
                    width={innerCircle.r* 1.2 }
                    height={innerCircle.r* 1.2 }
                    opacity={opacity}
                    transform={`translate(${innerCircle.x - innerCircle.r*0.6}, ${innerCircle.y- innerCircle.r*0.6})`}
                />
                itemCircles.push(
                    itemCircle
                )
            })
        })

        // console.info(root, datum)

        // sort the rules, draw the smallest boundray first
        // highlightRules = highlightRules.filter(id=>highlightCircles[id].length>0)
        

        let outlines = highlightRules.slice().sort((ruleA, ruleB)=>{
            return highlightCircles[ruleA].length - highlightCircles[ruleB].length
        }).map((ruleID, idx)=>{
                const percent = highlightRules.length==1?1:(idx/(highlightRules.length-1)) 
                const padding = ( 0.6 + 0.4* percent) * circlePadding
                return  <g key={`outline_${ruleID}`} className='outlines'>
                    <mask id={`mask_outline_${ruleID}`}>
                        {/* white part, show */}
                        <circle 
                        r={1.5*this.height/2} 
                        cx={this.width/2} 
                        cy={this.height/2} 
                        fill='white' />
                        {/* black part, hide */}
                        {highlightCircles[ruleID].map(set=>{
                            return <circle id={set.id} key={set.id} r={set.r-0.5*circlePadding + padding} cx={set.x} cy={set.y} fill="black"/>
                        })}           
                    </mask>
                    <g className='outlines' 
                    mask={`url(#mask_outline_${ruleID})`} 
                    // stroke={"#b9b9b9"} 
                    stroke = {boundaryColor[highlightRules.indexOf(ruleID)]}
                    fill="white">
                        {highlightCircles[ruleID].map(set=>{
                                return <circle id={set.id} key={set.id} 
                                r={set.r-0.5*circlePadding+padding+0.75*strokeWidth} cx={set.x} cy={set.y} 
                                strokeWidth={1.5*strokeWidth}
                                
                                />
                            }) 
                        }
                    </g> 
                {/* <circle className='outline' r={this.height/2} cx={this.height/2} cy={this.height/2} fill='red' stroke='gray' mask={`url(#outline_${hoverRule})`}/>  */}
                </g>
        })

        let background = <g className='background'>
        {root.children.map((outerCircle:ItemHierarchy) => {
            return <circle className='outlines'  key={outerCircle.id}
            // stroke={"#b9b9b9"} 
            cx={outerCircle.x}
            cy={outerCircle.y}
            r={outerCircle.r + 0.5*circlePadding}
            stroke = 'white'
            fill="white"/> 
            })
        }</g>
        
        
        return {itemCircles, outlines, background}

    }
    render() {
        let {ruleAgg} = this.props
        let {itemCircles, outlines, background} = this.draw()
       
        return <g className='bubbleSet' 
            id={`bubble_${ruleAgg.id}`} 
            ref={this.ref}
            // transform={`scale(${this.scaleRatio})`}
            >
                {background}
                {itemCircles}
                <g className='highlight outlines'>
                    {outlines}
                </g>
                
                
            {/* <rect className='outline' width={this.width} height={this.height} fill='none' stroke='gray'/> */}
            {/* <circle className='outline' r={this.height/2} cx={this.height/2} cy={this.height/2} fill='none' stroke='gray'/> */}
        </g>
    }
}
