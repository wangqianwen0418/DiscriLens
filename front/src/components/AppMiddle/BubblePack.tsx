// import {
//     BubbleSet,
//     PointPath,
//     ShapeSimplifier,
//     BSplineShapeGenerator
// } from 'lib/bubble.js';
import * as React from 'react';
import { RuleAgg, RuleNode, groupByKey, COLORS } from 'Helpers';
import { Rule, DataItem } from 'types';


import * as d3 from 'd3';

export interface Props {
    ruleAgg: RuleAgg,
    scoreDomain: [number, number] | [undefined, undefined],
    showIDs: string[],
    highlightRule: string,
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
    render() {
        let { ruleAgg, scoreDomain, highlightRule, samples } = this.props
        let rules = flatten(ruleAgg.nodes).sort((a,b)=>a.score-b.score),
            items = extractItems(rules)

        // console.info(highlightRule)

        // cluster item circles to a big circle
        let clusteredItems = groupByKey(items, (item)=>[item.score, item.groups.length])
        
        let scoreScale = d3
            .scaleLinear()
            .domain([0, scoreDomain[1]])
            .range([0, 0.6])
        // store the position of circles
        let radius = 4, width=200, scaleRatio=1 //radius of the item

        let root: ItemHierarchy = {
            id: 'root',
            children: [],
            score: null
        }
        let  childID = 0

        items.forEach((item, itemIdx) => {
            let currentGroup = item.groups.sort().join(',')
            if (itemIdx == 0) {
                root.children.push({
                    id: 'group_' + currentGroup,
                    score: item.score,
                    children: [{
                        id: item.id,
                        children: [],
                        score: item.score,
                    }]
                })
            }
            else {
                
                let prevItem = items[itemIdx - 1], prevGroup = prevItem.groups.sort().join(',')
                if (currentGroup!= prevGroup) {
                    root.children.push({
                        id: 'group_' + currentGroup,
                        score: item.score,
                        children: [{
                            id: item.id,
                            score: item.score,
                            children: [],
                        }]
                    })
                    childID += 1
                } else {
                    root.children[childID].children.push({
                        id: item.id,
                        score: item.score,
                        children: []
                    })
                }

            }
        })

        root.children = clusteredItems.map(cluster=>{
            return {
                id: cluster[0].groups.sort().join(','),
                score: null,
                children: cluster.map((item:any)=>{
                    let children:ItemHierarchy[]= []
                    return {
                        id: item.id,
                        score: item.score,
                        children
                    }
                })
            }
        })

        const pack = d3.pack()
            .size([width, 3*width])
            // .size([width * 35 * radius, Math.ceil(items.length / width) * 15 * radius])
        const datum = pack(
            d3.hierarchy(root)
                .sum(d => 1) // same radius for each item
        )

        let itemCircles: JSX.Element[] = []
        let itemsPos: any[] = []

        datum.children.forEach((set:any) => {
            let scoreColor = d3.interpolateOranges(scoreScale(set.children[0].data.score))
            let strokeColor = highlightRule==undefined?scoreColor:(set.data.id.includes(highlightRule)?scoreColor:'#ccc')
            let opacity = highlightRule==undefined?1:(set.data.id.includes(highlightRule)?1:0.2)
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
                // stroke={set.data.id.includes(highlightRule)?"gray":"#FF9F1E"}
                strokeWidth={set.data.id.includes(highlightRule)?4:2}
            />)
            set.children.forEach((item: any) => {
                scaleRatio = radius/item.r
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
                        strokeWidth='2'
                        opacity={opacity}
                        // fill={d3.interpolateOranges(scoreScale(item.data.score))}
                        // fill="#FF9F1E"
                        // opacity={scoreScale(item.data.score)}
                    />
                )
            })
        })

        // var bubbles = new BubbleSet(),
        //     padding = 2
            
        //     console.info('datum', datum)
        // var outlines = rules
        //     .filter(rule => showIDs.includes(rule.id.toString()))
        //     .map(rule => {
        //         // let itemIn = datum.children
        //         //     .filter((set:any) => set.data.id.split(',').includes(rule.id.toString()))
        //         //     .map(set => {
        //         //         return {
        //         //             x: set.x-set.r,
        //         //             y: set.y-set.r,
        //         //             width: set.r * 2,
        //         //             height: set.r * 2
        //         //         }
        //         //     })
        //         // let itemOut = datum.children
        //         //     .filter((set:any) => !set.data.id.split(',').includes(rule.id.toString()))
        //         //     .map(set => {
        //         //         return {
        //         //             x: set.x-set.r,
        //         //             y: set.y-set.r,
        //         //             width: set.r * 2,
        //         //             height: set.r * 2
        //         //         }
        //         //     })
        //         let itemIn = itemsPos
        //             .filter(itemP => rule.items.includes(itemP.id))
        //             .map(item => {
        //                 return {
        //                     x: item.x,
        //                     y: item.y,
        //                     width: item.r * 2/3,
        //                     height: item.r * 2/3
        //                 }
        //             })
        //         let itemOut = itemsPos
        //             .filter(itemP => !rule.items.includes(itemP.id))
        //             .map(item => {
        //                 return {
        //                     x: item.x,
        //                     y: item.y,
        //                     width: item.r * 2,
        //                     height: item.r * 2
        //                 }
        //             })
        //         var list = bubbles.createOutline(
        //             BubbleSet.addPadding(itemIn, padding),
        //             BubbleSet.addPadding(itemOut, padding),
        //             null
        //         );
        //         var outline = new PointPath(list).transform([
        //             new ShapeSimplifier(0.0),
        //             new BSplineShapeGenerator(),
        //             new ShapeSimplifier(0.1),
        //         ]);
        //         const onMouseEnter = () => this.highlightPath(rule.id.toString())
        //         return <path key={rule.id} d={outline.toString()} id={`outline_${rule.id}`}
        //             className='outline'
        //             onMouseEnter={onMouseEnter}
        //             onMouseLeave={this.onMouseLeave}
        //             fill='none' stroke={rule.id==highlightRule?'pink':'gray'} 
        //             strokeWidth={rule.id==highlightRule?4:1} 
        //             />
        //     })

        return <g className='bubbleSet' 
            id={`bubble_${ruleAgg.id}`} 
            transform={`scale(${scaleRatio})`}>
            {itemCircles}
            {/* {outlines} */}
        </g>
    }
}