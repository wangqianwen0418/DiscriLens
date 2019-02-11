import * as React from 'react';
import {DataItem, Status} from 'types';
import {Icon, Tooltip, Button} from 'antd';
import * as d3 from 'd3';

import "./Glyph.css"

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
    attrs_init: string[],
    attrs_button: any[],
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
    constructor(props:Props){
        super(props)
        this.state={
            attrs_init: null,
            attrs_button: null,
        }
        this.changeRule = this.changeRule.bind(this)
        this.initAttrs = this.initAttrs.bind(this)
    }

    initAttrs = (attrs_init:any,key_attrs:any) =>{

        let attrs_button = []
        this.setState({attrs_init:attrs_init})
        for(var i =0;i<key_attrs.length;i++){attrs_button.push([attrs_init[i],true])}
        this.setState({attrs_button:attrs_button})
    }
    
    changeRule = (e:any)=>{
        let ruleState = this.state.attrs_button
        ruleState[e][1] = !ruleState[e][1]
        this.setState({attrs_button:ruleState})
    }

    updateButton = (key_attrs:string[])=>{
        let button_attrs:string[] = []
        let new_attrButton:any[] = []
        this.state.attrs_button.map((attr,i)=>{
            button_attrs.push(attr[0])
        })
        key_attrs.map((key_attr,i)=>{
            if(button_attrs.includes(key_attr)){
                new_attrButton.push(this.state.attrs_button[button_attrs.indexOf(key_attr)])
            }else{new_attrButton.push([key_attr,false])}
        })
        this.setState({attrs_button:new_attrButton})
    }

    get_color = (risk_dif:number )=>{

        // get color interval
        let min_color = Math.min.apply(Math,this.props.rules.map((v)=>{return v['risk_dif']}))
        let max_color = Math.max.apply(Math,this.props.rules.map((v)=>{return v['risk_dif']}))
        //const interpolate = require('color-interpolate')
        let colormap = d3.interpolate('#6baed6','#DE4863')
        let colorscale = d3.scaleLinear().domain([min_color,max_color]).range([0,1])
        return colormap(colorscale(risk_dif))
    }

    drawLines = (ruleIn: rules, attrs: string[], samples: DataItem[],key_attrs:string[],attrs_num:string[])=>{

        /**?
         * Input is one rule, with seceral attributes and corresponding values
         * Output is lines and glyph
         */
        const dataPush = (x:number,y:number):curveData => {return {x,y}}
        
        let risk_dif: number = ruleIn.risk_dif
        // rule_out is m*n*2 array. m is the number of rules, n is the number of attrs, 
        //for each row of a rule is [attr,attr's value]
        let rules_out: any = ruleIn.rule
    
        // record attrbutes' position and corresponding value interval position
        // attr_pos = [attr's position, value's position, number of values, value]
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
            {rules_out.map((rule:any,rule_i:any)=>{
                let width_base = window.innerWidth*0.9 / attrs.length 
                let ListNum: curveData[] = []
                let ListNumBase: curveData[] = []
                ListNum.push(dataPush(0,0))
                ListNum.push(dataPush(width_base * 0.6 , 0))
                ListNumBase.push(dataPush(0,0))
                ListNumBase.push(dataPush(width_base * attrs.length , 0))
                
                const line = d3.line<curveData>().x(d=>d.x).y(d=>d.y)

                let output:any

                let num_output = <g transform={`translate(${width_base * attr_pos[rule_i][0]}, ${0})`}>
                <path d={line(ListNum)} style={{fill:'none',stroke:'#bbb',strokeWidth:'8px'}} />
                <Tooltip title={attr_pos[rule_i][3]}> 
                    <rect rx={2} width={width_base * 0.6 / attr_pos[rule_i][2]} height={8} style={{fill:this.get_color(risk_dif)}}
                    transform={`translate(${width_base * 0.6 / attr_pos[rule_i][2] * attr_pos[rule_i][1]}, ${-4})`}/>
                </Tooltip>
               </g>
                
                let rect_width = width_base * 0.6 / attr_pos[rule_i][2] / Math.sqrt(2)
                let cat_output = <g transform={`translate(${width_base * attr_pos[rule_i][0]}, ${0})`}>
                {Array.apply(null, Array(attr_pos[rule_i][2])).map((_:any, i:any)=>{
                    if(i==attr_pos[rule_i][1]){
                        return <Tooltip title={attr_pos[rule_i][3]}> 
                            <rect width={rect_width} height={rect_width}
                            style={{fill:this.get_color(risk_dif)}} transform={`translate(${width_base * 0.6 / attr_pos[rule_i][2] * i}
                                , ${-rect_width/2}) rotate(45,${rect_width/2},${rect_width/2})`} />
                        </Tooltip>
                    }else{
                        return <rect width={rect_width} height={rect_width}
                        style={{fill:"#bbb"}} transform={`translate(${width_base * 0.6 / attr_pos[rule_i][2] * i}
                        , ${-rect_width/2}) rotate(45,${rect_width/2},${rect_width/2})`} />
                    }
                })}
                
               </g>

                if(attrs_num.includes(rule[0])){
                    output = num_output
                }else{
                    output = cat_output
                }
                if(rule_i==0){
                    return <g key={rule_i}> 
                    <g className={`baseline`}>
                       <path d={line(ListNumBase)} style={{fill:'none',stroke:'#f0f0f0',strokeWidth:'1px'}}/>
                    </g>
                    {output}
                </g>
                }else{
                    return <g key={rule_i}>
                    {output}
                    </g>
                }
            }
        )}
        </g>
    }

    draw(){
        let {rules, samples, thr_rules, key_attrs, drag_array,protected_attr} = this.props
        let samples_numerical = samples.slice(0,1000)
        samples = samples.slice(1000,2000)
        
        // extract numerical attrs
        let attrs_num = [...Object.keys(samples[0])]
        // remove the attribute 'id' and 'class'
        //attrs.splice(attrs.indexOf('id'), 1)
        attrs_num.splice(attrs_num.indexOf('class'), 1)
        attrs_num.splice(attrs_num.indexOf(protected_attr), 1)
        attrs_num = attrs_num.filter((attr)=>typeof(samples_numerical[1][attr])=='number')

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
        // record the first version of attrs for reference
        if(this.state.attrs_init==null){this.initAttrs(attrs,key_attrs)}
        else{attrs=this.state.attrs_init}

        let attrs_new: string[] = []
        attrs_new = attrs.slice()
        if(drag_array.length!=0){
            for(var i=0;i<attrs.length;i++){
                attrs_new[drag_array[i][0]] = attrs[i]
            }
        }

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
                let rule_attrs: string[] = []
                for (var rule_attr in rule_split){ 
                    let rule_out = rule_split[rule_attr].split("=")
                    rules_out.push(rule_out)
                    rule_attrs.push(rule_out[0])
                }
                
                let rule_counter = 0
                let drag_arrayPos:number[] = []
                drag_array.map((drag,drag_i)=>{drag_arrayPos.push(drag[0])})
                rule_attrs.map((rule_attr:string)=>{
                    // if any attrs in this rule are not in key attrs, rule_counter++
                    if(key_attrs.includes(rule_attr)==false){rule_counter += 1}
                    // check whether this attr is folded
                })

                if(drag_array.length>0){
                    this.state.attrs_button.map((button)=>{
                        if(button[1]!=rule_attrs.includes(button[0])){
                            rule_counter += 1
                        }
                    })
                }
                // remove rules containing non-key attrs
                if(rule_counter==0){
                    rules_processed.push({rule:rules_out,risk_dif:risk_dif})
                }   
            }
        })

        


        let line_interval = window.innerHeight * 0.5 / (rules_processed.length + 1)
        let width_base = window.innerWidth*0.9 / attrs.length
        let rule_lines = rules_processed.map((rule,rule_i)=>{

                return <g key={rule_i+'rules'} transform={`translate(${window.innerWidth*0.1}, ${5 + line_interval*rule_i})`}>
                {
                    this.drawLines(rule,attrs_new,samples,key_attrs,attrs_num)
                }
                
            </g>         

        })
        
        return <g key='rule'>
            {rule_lines}
            {
                Array.apply(null, Array(key_attrs.length)).map((_:any, i:any)=>{
                    if(this.state.attrs_button!=null){
                        let button_click = () =>{
                            this.changeRule(i)
                        }
                        if(this.state.attrs_button.length!=key_attrs.length){this.updateButton(key_attrs)}
                        
                        if(i<this.state.attrs_button.length){
                            return <foreignObject key={'button' + i} width = '10px' height = '10px' transform={`translate(${width_base * (i+0.80)}, ${-3})`}>
                            <Button shape="circle" icon={this.state.attrs_button[i][1]?"down":"right"} size='small' onClick={button_click} />
                        </foreignObject>
                        }else{return null}
                        
                    }else{return null}
                })
            }
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