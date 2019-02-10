import * as React from 'react';
import {DataItem, Status} from 'types';
import {Icon, Tooltip} from 'antd';
import * as d3 from 'd3';

export interface Props{
    rules: DataItem[],
    samples: DataItem[],
    thr_rules:number[],
    key_attrs: string[],
    drag_array: number[][],
    protected_attr: string,
    fetch_groups_status: Status,
    
} 
export interface State{

} 
export interface curveData{
    x: number,
    y: number
}
export interface rules{
    rule: string[],
    risk_dif: number
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

export default class Glyph extends React.Component<Props, State>{
    public height= 40; bar_margin=1;attr_margin=8;viewSwitch=-1;

    get_color = (risk_dif:number )=>{

        // get color interval
        let min_color = Math.min.apply(Math,this.props.rules.map((v)=>{return v['risk_dif']}))
        let max_color = Math.max.apply(Math,this.props.rules.map((v)=>{return v['risk_dif']}))
        //const interpolate = require('color-interpolate')
        let colormap = d3.interpolate('#6baed6','#DE4863')
        let colorscale = d3.scaleLinear().domain([min_color,max_color]).range([0,1])
        return colormap(colorscale(risk_dif))
    }

    drawLines = (ruleIn: rules, attrs: string[], samples: DataItem[],key_attrs:string[])=>{

        /**?
         * Input is one rule, with seceral attributes and corresponding values
         * Output is lines and glyph
         */
        const dataPush = (x:number,y:number):curveData => {return {x,y}}
        
        let risk_dif: number = ruleIn.risk_dif
        let rules_out: any = ruleIn.rule
    
        // record attrbutes' position and corresponding value interval position
        let attr_pos: number[][] = [] 
        // loop over rules
        for (var rule in rules_out){ 
            for (var i=0;i<attrs.length;i++){ 
                // for each rule, loop to find its attribute position in attrs
                if(attrs[i]==rules_out[rule][0]){ 
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
                            <rect rx={2} width={width_base * 0.6 / attr_pos[rule_i][2]} height={8} style={{fill:this.get_color(risk_dif)}}
                            transform={`translate(${width_base * 0.6 / attr_pos[rule_i][2] * attr_pos[rule_i][1]}, ${-4})`}/>
                        </Tooltip>
                    </g>
                </g>
                }else{
                    return <g key={rule_i} transform={`translate(${width_base * attr_pos[rule_i][0]}, ${0})`}>
                        <path d={line(ListNum)} style={{fill:'none',stroke:'#bbb',strokeWidth:'3px'}} />
                        <Tooltip title={attr_pos[rule_i][3]}> 
                            <rect rx={2} width={width_base * 0.6 / attr_pos[rule_i][2]} height={8} style={{fill:this.get_color(risk_dif)}}
                            transform={`translate(${width_base * 0.6 / attr_pos[rule_i][2] * attr_pos[rule_i][1]}, ${-4})`}/>
                        </Tooltip>
                       </g>
                }
            }
        )}
        </g>
    }

    draw(){
        let {rules, samples, thr_rules, key_attrs, drag_array,protected_attr} = this.props
        //let samples_numerical = samples.slice(0,1000)
        samples = samples.slice(1000,2000)

        // process rules
        let rules_processed:rules[] = []
        rules.map((rule)=>{
            if((rule['risk_dif']<thr_rules[0])||(rule['risk_dif']>thr_rules[1])){
        
                let risk_dif: number = rule.risk_dif as number
                let rule_ante: string = rule.antecedent as string
                //first split the string by "'"
                let rule_split = rule_ante.split("'") 
                // remove simples like "[", ","
                rule_split = rule_split.filter((s)=>s.length>5) 
                //rules in array format. [[attribute, value],[attr2,value2],....]
                let rules_out: any = [] 
                for (var rule_attr in rule_split){ 
                    let rule_out = rule_split[rule_attr].split("=")
                    rules_out.push(rule_out)
                }
                
                let rule_counter = 0
                rules_out.map((rule_out:string[])=>{
                    // if any attrs in this rule are not in key attrs, rule_counter++
                    if(key_attrs.includes(rule_out[0])==false){rule_counter += 1}
                })
                // remove rules containing non-key attrs
                if(rule_counter==0){
                    rules_processed.push({rule:rules_out,risk_dif:risk_dif})
                }
            }
        })


        let attrs = [...Object.keys(samples[0])]
        // remove the attribute 'id' and 'class'
        //attrs.splice(attrs.indexOf('id'), 1)
        attrs.splice(attrs.indexOf('class'), 1)
        attrs.splice(attrs.indexOf(protected_attr), 1)
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
        if(drag_array.length!=0){
            for(var i=0;i<attrs.length;i++){
                attrs_new[drag_array[i][0]] = attrs[i]
            }
        }
        
        let line_interval = window.innerHeight * 0.5 / (rules_processed.length + 1)

        let rule_lines = rules_processed.map((rule,rule_i)=>{

                return <g key={rule_i+'rules'} transform={`translate(${window.innerWidth*0.1}, ${5 + line_interval*rule_i})`}>
                {
                    this.drawLines(rule,attrs_new,samples,key_attrs)
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