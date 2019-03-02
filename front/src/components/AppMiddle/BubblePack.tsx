// import {
//     BubbleSet,
//     PointPath,
//     ShapeSimplifier,
//     BSplineShapeGenerator
// } from 'lib/bubble.js';
import * as React from 'react';
import { RuleAgg, RuleNode, COLORS} from 'Helpers';
import { Rule, DataItem } from 'types';


import * as d3 from 'd3';

export interface Props {
    ruleAgg: RuleAgg,
    scoreDomain: [number, number] | [undefined, undefined],
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
    score: number | null
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
                itemSet[idx].score = Math.max(itemSet[idx].score, rule.risk_dif)
                if(!itemSet[idx].groups.includes(rule.id.toString())){
                    itemSet[idx].groups.push(rule.id.toString())
                }

            } else {
                itemSet.push({
                    id: item,
                    score: rule.risk_dif,
                    groups: [rule.id.toString()]
                })
            }
        }
    }
    
    itemSet.sort((a, b) => a.score - b.score)
    // console.info('sort score', itemSet)
    itemSet.sort(
            (a,b) => b.groups.length - a.groups.length
            )
    // console.info('sort group', itemSet)
    return itemSet
}

export default class Bubble extends React.Component<Props, State>{
    width=100; height=100; scaleRatio = 1; radius=4; ref: React.RefObject<SVGAElement>=React.createRef();
    constructor(props: Props){
        super(props)
    }
    highlightPath(id: string) {
        d3.select(`path#outline_${id}`)
            .style('stroke-width', 7)
            .style('stroke', 'pink')
    }
    onMouseLeave() {
        d3.selectAll('path.outline')
            .style('stroke', 'gray')
            .style('stroke-width', 1)
    }
    getSize(){
        return [this.width*this.scaleRatio, this.height*this.scaleRatio]
        // let box = this.ref.current.getBoundingClientRect()
        // return [box.width, box.height]
    }
    render() {
        let { ruleAgg, scoreDomain, hoverRule, highlightRules, samples } = this.props
        let rules = flatten(ruleAgg.nodes).sort((a,b)=>a.score-b.score),
            items = extractItems(rules),
            circlePadding = this.radius*(highlightRules.length)*1.5 // change circle padding based on the highlight boundaries

        // console.info(hoverRule)

        // cluster item circles to a big circle
        // let clusteredItems = groupByKey(items, (item)=>[item.score, item.groups.length])
        
        let scoreScale = d3
            .scaleLinear()
            .domain([0, scoreDomain[1]])
            .range([0, 0.6])
        // store the position of circles

        let root: ItemHierarchy = {
            id: 'root',
            children: [],
            score: null
        }
        let  childDict:any = []

        items.forEach((item) => {
            let currentGroup = item.groups.sort().join(',')
            
            // let prevItem = items[itemIdx - 1], prevGroup = prevItem.groups.sort().join(',')
            if (!childDict.includes(currentGroup)) {
                root.children.push({
                    id: 'group_' + currentGroup,
                    score: item.score,
                    children: [{
                        id: item.id,
                        score: item.score,
                        children: [],
                    }]
                })
                childDict.push(currentGroup)
            } else {
                let childID = childDict.indexOf(currentGroup)
                root.children[childID].children.push({
                    id: item.id,
                    score: item.score,
                    children: []
                })
            }
        })

        // root.children = clusteredItems.map(cluster=>{
        //     return {
        //         id: cluster[0].groups.sort().join(','),
        //         score: null,
        //         children: cluster.map((item:any)=>{
        //             let children:ItemHierarchy[]= []
        //             return {
        //                 id: item.id,
        //                 score: item.score,
        //                 children
        //             }
        //         })
        //     }
        // })

        const pack = d3.pack()
            .size([this.width, this.height])
            .padding((d:any)=>{
                return d.depth==0?circlePadding:0
            })
            // .size([width * 35 * radius, Math.ceil(items.length / width) * 15 * radius])
        const datum = pack(
            d3.hierarchy(root)
                .sum(d => 1) // same radius for each item
        )

        let itemCircles: JSX.Element[] = []
        let highlightCircles: {[id:string]: d3.HierarchyCircularNode<any>[]} = {}
        let itemsPos: any[] = []
        let strokeWidth = 2

        datum.children.forEach((set:d3.HierarchyCircularNode<any>) => {
            let scoreColor = d3.interpolateOranges(scoreScale(set.children[0].data.score))
            let isHover = set.data.id.includes(hoverRule)
            // let isHighlight = containsAttr(set.data.id, highlightRules).length>0
            let strokeColor = hoverRule==undefined?scoreColor:(isHover?scoreColor:'#ccc')
            let opacity = hoverRule==undefined?1:(isHover?1:0.2)


            


            highlightRules.forEach(ruleID=>{
                if (!highlightCircles[ruleID]){
                    highlightCircles[ruleID] = []
                }
                if(set.data.id.includes(ruleID)){
                    highlightCircles[ruleID].push(
                        set
                    )
                }
            })
            
            itemCircles.push(<circle
                key={set.data.id}
                id={set.data.id}
                cx={set.x}
                cy={set.y}
                r={set.r}
                // fill={scoreColor}
                fill="white"
                // opacity='0.5'
                stroke={strokeColor}
                // fill="transparent"
                // stroke={set.data.id.includes(hoverRule)?"gray":"#FF9F1E"}
                // strokeWidth={ (isHighlight ? 2*strokeWidth : strokeWidth)/this.scaleRatio }
                strokeWidth={strokeWidth/this.scaleRatio}
            />)
            set.children.forEach((item: any) => {
                this.scaleRatio = (this.radius+strokeWidth/2)/item.r
                itemsPos.push({
                    x: item.x,
                    y: item.y,
                    r: item.r*0.9,
                    ...item.data
                })
                let id = item.data.id
                let sample = samples[id]
                let [protectedAttr, protectedVal] = this.props.protectedVal.split('=')
                let itemColor = sample[protectedAttr]==protectedVal?COLORS[1]: COLORS[0]
                itemCircles.push(
                    <circle
                        key={id} cx={item.x} cy={item.y} r={item.r*0.8 }
                        fill={sample.class=="1"?itemColor :'white'}
                        stroke={itemColor}
                        strokeWidth={strokeWidth/this.scaleRatio}
                        opacity={opacity}
                        // fill={d3.interpolateOranges(scoreScale(item.data.score))}
                        // fill="#FF9F1E"
                        // opacity={scoreScale(item.data.score)}
                    />
                )
            })
        })

        // sort the rules, draw the smallest boundray first
        // highlightRules = highlightRules.filter(id=>highlightCircles[id].length>0)
        highlightRules.sort((ruleA, ruleB)=>{
            return highlightCircles[ruleA].length - highlightCircles[ruleB].length
        })

        let outlines = highlightRules.map((ruleID, idx)=>{
                const percent = highlightRules.length==1?0:(idx/(highlightRules.length-1)) 
                const padding = ( 0.55 + 0.45* percent) * circlePadding/this.scaleRatio
                return  <g key={`outline_${ruleID}`} className='outlines'>
                    <mask id={`mask_outline_${ruleID}`}>
                        {/* white part, show */}
                        <circle 
                        r={1.5*this.height/2} 
                        cx={this.height/2} 
                        cy={this.height/2} 
                        fill='white' />
                        {/* black part, hide */}
                        {highlightCircles[ruleID].map(set=>{
                            return <circle id={set.data.id} key={set.data.id} r={set.r + padding} cx={set.x} cy={set.y} fill="black"/>
                        })}           
                    </mask>
                    <g className='outlines' mask={`url(#mask_outline_${ruleID})`} stroke={"gray"} fill="gray">
                        {highlightCircles[ruleID].map(set=>{
                                return <circle id={set.data.id} key={set.data.id} 
                                r={set.r+padding} cx={set.x} cy={set.y} 
                                strokeWidth={2*strokeWidth/this.scaleRatio}
                                
                                />
                            }) 
                        }
                    </g> 
                {/* <circle className='outline' r={this.height/2} cx={this.height/2} cy={this.height/2} fill='red' stroke='gray' mask={`url(#outline_${hoverRule})`}/>  */}
                </g>
        })

       
        return <g className='bubbleSet' 
            id={`bubble_${ruleAgg.id}`} 
            ref={this.ref}
            transform={`scale(${this.scaleRatio})`}>
                {itemCircles}
                <g className='highlight outlines'>
                    {outlines}
                </g>
                
                
            {/* <rect className='outline' width={this.width} height={this.height} fill='none' stroke='gray'/> */}
            {/* <circle className='outline' r={this.height/2} cx={this.height/2} cy={this.height/2} fill='none' stroke='gray'/> */}
        </g>
    }
}