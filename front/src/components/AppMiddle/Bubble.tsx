import {BubbleSet, 
    PointPath,
    ShapeSimplifier,
    BSplineShapeGenerator} from 'lib/bubble.js';
import * as React from 'react';
import {RuleAgg, RuleNode} from 'Helpers/ruleAggregate';
import {Rule} from 'types';

import * as d3 from 'd3';

export interface Props{
    ruleAgg: RuleAgg
}
export interface State{

}
export interface SetData{
    sets: string[],
    label: string, 
    size:number,
    score: number
    [key:string]: any
}
const flatten = (nodes: RuleNode[]):Rule[]=>{
    let rules:Rule[] = []
    for (let node of nodes){
        rules.push(node.rule)
        if (node.child.length>0){
            rules = rules.concat( flatten(node.child) )
        }
    }
    return rules
}

const extractItems = (rules: Rule[]):{id:any, score:number}[]=>{
    let itemSet:{id:any, score:number}[] = []
    for (let rule of rules){
        for (let item of rule.items){
            let idx = itemSet
                    .map(d=>d.id)
                    .indexOf(item)
            if(idx>-1){
                itemSet[idx]={
                    id:item, 
                    score: Math.max(itemSet[idx].score, rule.risk_dif)
                }
            }else{
                itemSet.push({
                    id:item,
                    score: rule.risk_dif
                })
            }
        }
    }
    itemSet.sort((a,b)=>a.score-b.score)
    return itemSet
}

export default class Bubble extends React.Component<Props, State>{
    highlightPath(id:string){
        d3.select(`path#outline_${id}`)
        .style('stroke-width', 7)
        .style('stroke', 'pink')
        .style('z-index', 5)
    }
    onMouseLeave(){
        d3.selectAll('path.outline')
            .style('stroke', 'black')
            .style('stroke-width', 1)
    }
    render(){
        let {ruleAgg} = this.props
        let rules = flatten(ruleAgg.nodes),
            items = extractItems(rules)
        let opacityScale = d3
                        .scaleLinear()
                        .domain(d3.extent(items.map(item=>item.score)))
                        .range([0.2, 1])
        // store the position of circles
        let width = Math.floor( Math.sqrt(items.length) ), //number of items of each row
            radius = 2 //radius of the item
        let itemPos = items.map((item, idx)=>{
            let posY = Math.floor(idx/width), 
            posX = (idx-posY*width) 
            return {x: posX*16*radius, y:posY*16*radius, width:2*radius, height: 2*radius, ...item}
        })
        // draw items
        let itemCircles = itemPos.map(item=>{
            return <circle
            r={3*radius}
            key={item.id}
            cx={item.x}
            cy={item.y}
            fill="#FF9F1E"
            opacity={opacityScale(item.score)}
            />
        })
        // draw set boundaries
        // const onMouseLeave = ()=>{
        //     d3.selectAll('path.outline')
        //     .style('stroke', 'black')
        //     .style('stroke-width', 1)
        //     }
        
        var bubbles = new BubbleSet(),
            padding = 2
        var outlines = rules.map(rule=>{
            let itemIn = itemPos.filter(itemP=>rule.items.includes(itemP.id))
            let itemOut = itemPos.filter(itemP=>!rule.items.includes(itemP.id))
            var list = bubbles.createOutline(
                BubbleSet.addPadding(itemIn, padding),
                BubbleSet.addPadding(itemOut, padding),
                null
              );
              var outline = new PointPath(list).transform([
                new ShapeSimplifier(0.0),
                new BSplineShapeGenerator(),
                new ShapeSimplifier(0.0),
              ]);
              const onMouseEnter=()=>this.highlightPath(rule.id.toString())
              return <path key={rule.id} d={outline.toString()} id={`outline_${rule.id}`}
              className='outline'
              onMouseEnter={onMouseEnter}
              onMouseLeave={this.onMouseLeave}
              fill='none' stroke='gray'/>
        })

        return <g className='bubbleSet' id={`bubble_${ruleAgg.id}`}>
                {itemCircles}
                {outlines}
            </g>
    }
}