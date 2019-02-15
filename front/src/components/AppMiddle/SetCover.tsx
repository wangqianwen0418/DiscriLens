import * as React from 'react';
import * as d3 from 'd3';

export interface Props{
    rules: any[],
    benefitCls: string,
    ranges: {attr:string, range:string[]}[]
}
export interface State{
    selectRuleID: number
}

interface AvoidClutter {
    [attr:string]: Rangelist
}
interface Rangelist {
    [range:string]: [number,number]
}
// const norm=(elift:number):number=>{
//     return elift>1?elift:1/elift
// }

export default class SetCover extends React.Component<Props, State>{
    lineW:number = 4;
    constructor(props:Props){
        super(props)
        this.state={
            selectRuleID: -1
        }
        this.changeRule = this.changeRule.bind(this)
    }
    changeRule(id: number){
        this.setState({selectRuleID: id})
        // console.info(this.props.rules[id])
    }
    draw(){
        /*
        * Parameters
        *****************************/
        let {ranges, rules, benefitCls} = this.props
        let {selectRuleID} = this.state
        
        rules.forEach(rule=>{
            let {risk_dif} = rule 
            rule.favorPd = rule.cls.includes(benefitCls)?risk_dif : -1*risk_dif
        })
        // deleted repeated rules
        let uniqueAnte:string[] = []
        rules.forEach((rule, i)=>{
            let {antecedent} = rule
            if (uniqueAnte.indexOf(antecedent.toString())==-1){
                uniqueAnte.push(antecedent.toString())
            }else{
                rules.splice(i, 1)
            }
        })
        // sort
        rules.sort((a,b)=>(Math.abs(a.favorPd)-Math.abs(b.favorPd))) //ascending order

        let attrs = ranges.map(d=>d.attr)
        attrs.splice(attrs.indexOf('id'), 1)
        attrs.splice(attrs.indexOf('class'), 1)
        attrs.splice(attrs.indexOf('gender'), 1)

        const width = window.innerWidth*0.8, height = 400, padding = 28;
        
        // Horizontal scale
        const xScale = d3.scalePoint()
            .domain(attrs)
            .range([padding, width-padding]);
        
        // Each vertical scale
        let yScales:any = {};
        ranges.forEach(x=>{
            yScales[x.attr] = d3.scaleBand()
            .domain(x.range)
            .range([height-padding, padding])
            .paddingInner(0.05);
        });
        // color scale
        let colorScale = d3.scaleLinear()
        .domain(
            // d3.extent( 
            //     rules.map(rule=>rule.favorPd) 
            // )
            [0, d3.max(rules.map(rule=>rule.favorPd) ) ]
        ).range([0, 1])

        const colorScheme = (favorPd:number):string=>{
            if(favorPd>=0){
                return d3.interpolateOranges(colorScale(favorPd))
            }else{
                return d3.interpolateBlues(colorScale(-1*favorPd))
            }
        }

        let avoidClutter: AvoidClutter = {}
        ranges.forEach(r=>{
            avoidClutter[r.attr]={}
            r.range.forEach(name=>{
                avoidClutter[r.attr][name]= [0, 0] // count lines cross the upside and downside of a range
            })
        })

        
        // Paths for data
        let areaGene = d3.area()
        // .curve(d3.curveCardinal.tension(0.5))
        .curve(d3.curveMonotoneX)
        // .curve(d3.curveStep)
        // .curve(stepRound)
        .x( 
            (d:any)=>{ return xScale(d.attr); } 
        ).y0(
            (d:any)=>{ 
                let range = d.range
                if (!range){
                    let rangeNames = ranges.filter(r=>r.attr==d.attr)[0].range
                    range = rangeNames[rangeNames.length-1]
                }
                let offset:number = avoidClutter[d.attr][range][0]
                avoidClutter[d.attr][range][0] = offset +1
                return yScales[d.attr](range) + this.lineW * offset * 2 
                
            } 
        ).y1( 
            (d:any)=>{ 
                let range = d.range
                if (!range){
                    let rangeNames = ranges.filter(r=>r.attr==d.attr)[0].range
                    range = rangeNames[0]
                }
                let offset:number = avoidClutter[d.attr][range][1]
                avoidClutter[d.attr][range][1] = offset +1
                return yScales[d.attr](range) + yScales[d.attr].bandwidth() - this.lineW * (offset - 1) * 2 
                
            } 
        );
        
        let paths = rules.map((rule, i)=>{
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
            const color = colorScheme(rule.favorPd)
            const selectRule = ()=>this.changeRule(i)
            const unselectRule = ()=>this.changeRule(-1)
            return <path 
                d={pathData} 
                key={i+rule.antecedent} 
                fill={color}
                // fill='transparent' 
                fillOpacity={selectRuleID==i?0.6:0.1} 
                stroke={color} 
                strokeOpacity={0.8}
                strokeWidth={this.lineW} 
                onMouseOver={selectRule}
                onMouseOut = {unselectRule}
                />
        })
        let labels = attrs.map(attr=>{
            return <text key={attr} transform={`translate(${xScale(attr)}, ${height-padding}) rotate(30)`}>
                    {attr}
                </text>
        })
        return {paths, labels}
    }
    render(){
        let {paths, labels} = this.draw()
        return <g className='setCover' transform={`translate(${window.innerWidth*0.2}, ${70})`}>
            <g> {paths} </g>
            <g> {labels} </g>
        </g>
    }
}