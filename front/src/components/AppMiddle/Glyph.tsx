import * as React from 'react';
import {DataItem, Status} from 'types';
import {Icon, Tooltip} from 'antd';
import * as d3 from 'd3';

export interface Props{
    rules: DataItem[],
    samples: DataItem[],
    thr_rules:number[],
    key_attrs: string[],
    g_endPos: number[][],
    fetch_groups_status: Status,
} 
export interface State{

} 
export interface curveData{
    x: number,
    y: number
}


const extract_range = (highlightRange:string)=>{
    let xRange = 0
    if((highlightRange.includes('>'))||(highlightRange.includes('<'))){
        let numbers: number[] = highlightRange.match(/\d+/g).map(Number)
        if(numbers.length==2){xRange = numbers[0]}
        else if(highlightRange.includes('>')){xRange = numbers[0]}
        else{xRange = 0}
        return xRange
    }else{
        return -1
    }
    
}

const get_color = (elift:number )=>{

    const interpolate = require('color-interpolate')
    let colormap = interpolate(['#6baed6','#DE4863'])
    let colorscale = d3.scaleLinear().domain([0.5,1.5]).range([0,1])
    return colormap(colorscale(elift))
}
const drawLines = (ruleIn: DataItem, attrs: string[], samples: DataItem[],key_attrs:string[])=>{

    /**?
     * Input is one rule, with seceral attributes and corresponding values
     * Output is line
     */
    const dataPush = (x:number,y:number):curveData => {return {x,y}}
    
    let elift: number = ruleIn.elift as number
    let rule_temp: string = ruleIn.antecedent as string
    let rule_split = rule_temp.split("'") //first split the string by "'"
    rule_split = rule_split.filter((s)=>s.length>5) // remove simples like "[", ","
    let rules_out: any = [] //rules in array format. [[attribute, value],[attr2,value2],....]
    //let rule_counter = 0
    for (var rule in rule_split){ 
        let rule_out = rule_split[rule].split("=")
        rules_out.push(rule_out)
        //if(~key_attrs.includes(rule_out[0])){rule_counter += 1}
    }
    //if(rule_counter>=1){return null}
    let attr_pos: number[][] = [] // record attrbutes' position and corresponding value interval position
    for (var rule in rules_out){ // loop over rules
        for (var i=0;i<attrs.length;i++){ 
            if(attrs[i]==rules_out[rule][0]){ // for each rule, loop to find its attribute position in attrs
                let ranges = samples.map(d=>d[attrs[i]])
                 .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)
                for (var j=0;j<ranges.length;j++){
                    if(ranges[j]==rules_out[rule][1]){
                        if(extract_range(rules_out[rule][1])!=-1){
                            let attr_range: number[] = []
                            ranges.map((d)=>{
                                let d_in: string = d as string
                                attr_range.push(extract_range(d_in))})
                            attr_range = attr_range.sort((a,b)=>a-b)
                            attr_pos.push([i,attr_range.indexOf(extract_range(rules_out[rule][1])),ranges.length,rules_out[rule][1]])
                        }else{attr_pos.push([i,j,ranges.length,rules_out[rule][1]])}
                    }
                }
            }
        }
    }
    return <g key={'rules'}>
        {rules_out.map((_:any,rule_i:any)=>{
            let width_base = window.innerWidth*0.9 / attrs.length 
            let ListNum: curveData[] = []
            let ListNumBase: curveData[] = []
            ListNum.push(dataPush(0,0))
            ListNum.push(dataPush(width_base * 0.6 , 0))
            ListNumBase.push(dataPush(0,0))
            ListNumBase.push(dataPush(width_base * attrs.length , 0))
            
            const line = d3.line<curveData>().x(d=>d.x).y(d=>d.y)
            if(rule_i==0){
                return <g>
                <g key={'baseline'}>
                   <path d={line(ListNumBase)} style={{fill:'none',stroke:'#f0f0f0',strokeWidth:'1px'}}/>
                </g>
                <g key={rule_i} transform={`translate(${width_base * attr_pos[rule_i][0]}, ${0})`}>
                    <path d={line(ListNum)} style={{fill:'none',stroke:'#bbb',strokeWidth:'3px'}} />
                    <Tooltip title={attr_pos[rule_i][3]}> 
                        <rect rx={2} width={width_base * 0.6 / attr_pos[rule_i][2]} height={8} style={{fill:get_color(elift)}}
                        transform={`translate(${width_base * 0.6 / attr_pos[rule_i][2] * attr_pos[rule_i][1]}, ${-4})`}/>
                    </Tooltip>
                </g>
            </g>
            }else{
                return <g key={rule_i} transform={`translate(${width_base * attr_pos[rule_i][0]}, ${0})`}>
                    <path d={line(ListNum)} style={{fill:'none',stroke:'#bbb',strokeWidth:'3px'}} />
                    <Tooltip title={attr_pos[rule_i][3]}> 
                        <rect rx={2} width={width_base * 0.6 / attr_pos[rule_i][2]} height={8} style={{fill:get_color(elift)}}
                        transform={`translate(${width_base * 0.6 / attr_pos[rule_i][2] * attr_pos[rule_i][1]}, ${-4})`}/>
                    </Tooltip>
                   </g>
            }
        }
    )}
    </g>
}


export default class Glyph extends React.Component<Props, State>{
    public height= 40; bar_margin=1;attr_margin=8;viewSwitch=-1;
    draw(){
        let {rules, samples, thr_rules, key_attrs, g_endPos} = this.props
        //let samples_numerical = samples.slice(0,1000)
        samples = samples.slice(1000,2000)
        rules = rules.filter((s)=>(s['elift']<thr_rules[0])||(s['elift']>thr_rules[1]))

        let attrs = [...Object.keys(samples[0])]
        // remove the attribute 'id' and 'class'
        //attrs.splice(attrs.indexOf('id'), 1)
        attrs.splice(attrs.indexOf('class'), 1)
        attrs.splice(attrs.indexOf('sex'), 1)
        attrs.sort((a,b)=>{
            if(key_attrs.indexOf(a)!=-1){
                return -1
            }else if(key_attrs.indexOf(b)!=-1){
                return 1
            }
            return 0
        })
    
        let attrs_new: string[] = []
        attrs_new = attrs.slice()
        if(g_endPos.length!=0){
            for(var i=0;i<attrs.length;i++){
                console.log(i)
                console.log(attrs[i])
                console.log(attrs)
                attrs_new[g_endPos[i][0]] = attrs[i]
            }
        }
        
        let line_interval = window.innerHeight * 0.5 / (rules.length + 1)

        let rule_lines = rules.map((rule,rule_i)=>{

                return <g key={rule_i+'rules'} transform={`translate(${window.innerWidth*0.1}, ${5 + line_interval*rule_i})`}>
                {
                    drawLines(rule,attrs_new,samples,key_attrs)
                }
            </g>         

        })
        
        return <g>
            {rule_lines}
        </g>
    }
    
    render(){
        
        let {fetch_groups_status} = this.props
        let content:JSX.Element = <g/>
        switch(fetch_groups_status){
            case Status.INACTIVE:
                content = <text>no data</text>
                break
            case Status.PENDING:
            content = <g transform={`translate(${window.innerWidth*.5}, ${100})`}>
                        <foreignObject>
                        <Icon 
                            type="sync" 
                            spin={true} 
                            style={{fontSize: '40px', margin: '10px'}}
                        />
                        </foreignObject>
                    </g>
                break
            case Status.COMPLETE:
                content = this.draw()
                break
            default:
                break

        }

        return(<g 
            className='glyph' 
            transform={`translate(${window.innerWidth*0.01}, ${0})`}
        >
            {content}
        </g>        
    )}
}