import * as React from 'react';
import * as venn from 'lib/venn.js';
import * as d3 from 'd3';
import {RuleAgg, RuleNode} from 'Helpers';
import {Rule} from 'types';

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
        if (node.children.length>0){
            rules = rules.concat( flatten(node.children) )
        }
    }
    return rules
}

var combine = function(a:string[], min:number) {
    var fn = function(n:number, src:string[], got:string[], all:string[][]) {
        if (n == 0) {
            if (got.length > 0) {
                all[all.length] = got;
            }
            return;
        }
        for (var j = 0; j < src.length; j++) {
            fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
        }
        return;
    }
    var all:string[][] = [];
    for (var i = min; i < a.length; i++) {
        fn(i, a, [], all);
    }
    all.push(a);
    return all;
}

const addEmptySet = (setDatum: SetData[]): SetData[]=>{
    let currentContexts = setDatum.map(setData=>setData.sets)
    let flatContext:string[] = [].concat.apply([], currentContexts)
    let singSet = Array.from (
        new Set(flatContext)
        )
    let allContexts = combine(singSet, 1)

    let stringContext = currentContexts.map(d=>d.join(','))
    allContexts
    .filter(context=>!stringContext.includes(context.join(',')))
    .forEach(context=>{
        setDatum.push({
            sets:context,
            label: context.join(','),
            size: 0,
            score: 0
        })
    })

    return setDatum
}


export default class Eular extends React.Component<Props, State>{
    componentDidMount(){
        let {id, nodes, antecedent} = this.props.ruleAgg
        let rules = flatten(nodes)
        let setDatum = rules.map(rule=>{
            let {antecedent:ruleAntecedent, items, risk_dif} = rule
            let sets = ruleAntecedent.filter(attrVal=>!antecedent.includes(attrVal))
            sets.unshift(antecedent.join(',')) 
            return {
                sets,
                label: sets.join(', '),
                size: items.length,
                score: risk_dif,
            }
        })
        setDatum = addEmptySet(setDatum)
        //console.info(setDatum)

        // let setDatum = [
        //     {sets:["Audio"], label: "Audio", size: 8.91},
        //     {sets:["Direct Buy"], label: "Direct Buy", size: 34.53},
        //     {sets:["Branded Takeover"], label: "Branded Takeover", size: 40.9},
        //     {sets: ["Audio", "Direct Buy"], label: "Audio and Direct Buy", size: 5.05},
        //     {sets: ["Audio", "Branded Takeover"], label: "Audio and Branded Takeover", size: 3.65},
        //     {sets: ["Direct Buy", "Branded Takeover"], label: "Direct Buy and Branded Takeover", size: 4.08},
        //     {sets: ["Audio", "Direct Buy", "Branded Takeover"], label: "Audio, Direct Buy, and Branded Takeover", size: 2.8}
        //     ];
        
        var chart = venn.VennDiagram()
        chart.width(500)
        chart.height(400)

        d3.select(`#euler_${id}`).datum(setDatum).call(chart);
        // var div = d3.select(`#${id}`).datum(setDatum).call(chart);
            // div.selectAll("text").style("fill", "white");
            // div.selectAll(".venn-circle path")
            //         .style("fill-opacity", .8)
            //         .style("stroke-width", 1)
            //         .style("stroke-opacity", 1)
            //         .style("stroke", "fff");
    }
    render(){
        let {id} = this.props.ruleAgg
        return <div className='euler' id={`euler_${id}`}/>
    }
}