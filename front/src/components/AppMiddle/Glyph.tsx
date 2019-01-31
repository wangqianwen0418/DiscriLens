import * as React from 'react';
import {DataItem, Status, KeyGroup} from 'types';
//import {Icon} from 'antd';
//import {countItem, cutTxt, getColor, getRadius} from 'components/helpers';
//import * as d3 from 'd3';

//import { line, range } from 'd3';

export interface Props{
    key_attrs: string[],
    samples: DataItem[],
    key_groups: KeyGroup[],
    fetch_groups_status: Status
} 
export interface State{

} 
const drawCurves = (attr: string,line_w: number)=>{
    
    return <g>

    </g>
}


export default class Glyph extends React.Component<Props, State>{
    public height= 40; bar_margin=1;attr_margin=8;viewSwitch=-1;
    draw(){
        let {samples, key_attrs, key_groups} = this.props
        console.log(samples,key_attrs,key_groups)

        let attrs = [...Object.keys(samples[0])]
        // remove the attribute 'id' and 'class'
        //attrs.splice(attrs.indexOf('id'), 1)
        attrs.splice(attrs.indexOf('class'), 1)
        attrs.splice(attrs.indexOf('sex'), 1)
        // move key attributes to the front
        attrs.sort((a,b)=>{
            if(key_attrs.indexOf(a)!=-1){
                return -1
            }else if(key_attrs.indexOf(b)!=-1){
                return 1
            }
            return 0
        })
        console.log(key_groups)
        console.log(attrs)
        return drawCurves('',2)
       
    }
    
    render(){
        
        const a = this.draw()
        console.log(a)
        return(<g 
            className='Attributes' 
            transform={`translate(${0}, ${0})`}
        >
        </g>

        
    )}
}