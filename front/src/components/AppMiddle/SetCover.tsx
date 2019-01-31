import * as React from 'react';
import * as d3 from 'd3';

export interface Props{
    rules: any[],
    ranges: {attr:string, range:string[]}[]
}
export interface State{

}



export default class SetCover extends React.Component<Props, State>{
    draw(){
        /*
        * Parameters
        *****************************/
        let {ranges, rules} = this.props
        const attrs = ranges.map(d=>d.attr)
        const width = window.innerWidth, height = 400, padding = 28;
        
        // Horizontal scale
        const xScale = d3.scalePoint()
            .domain(attrs)
            .range([padding, width-padding]);
        
        // Each vertical scale
        let yScales:any = {};
        ranges.map(x=>{
            yScales[x.attr] = d3.scaleBand()
            .domain(x.range)
            .range([height-padding, padding]);
        });
        
        // Paths for data
        let areaGene = d3.area()
        .curve(d3.curveMonotoneX)
        .x( 
            (d:any)=>{ return xScale(d.attr); } 
        ).y0(
            (d:any)=>{ return d.range?yScales[d.attr](d.range): padding ; } 
        ).y1( 
            (d:any)=>{ return d.range?yScales[d.attr](d.range) + yScales[d.attr].bandwidth(): height-padding; } 
        );
        
        let paths = rules.map(rule=>{
            // let data = rule.antecedent.sort(attrs.indexOf).map((d:string)=>{
            //     return {
            //         attr: d.split('=')[0],
            //         range: d.split('=')[1]
            //     }
            // })
            let context = {}
            rule.antecedent.forEach((ant:string)=>{
                let antArr = ant.split('=')
                context[antArr[0]] = antArr[1]
            })
            let data:any = attrs.map(attr=>{
                return {
                    attr, 
                    range: context[attr]
                }
            })
            let pathData = areaGene(data)
            const elift = rule.elift>1?rule.elift:1/rule.elift
            return <path d={pathData} key={rule.antecedent} fill='#555' opacity={0.1*elift}/>
        })
        return paths
    }
    render(){
        return <g className='setCover'>
            {this.draw()}
        </g>
    }
}