import * as React from 'react';
import {DataItem, Status} from 'types';
import {Icon} from 'antd';
import {countItem, cutTxt, getColor} from 'components/helpers';
import * as d3 from 'd3';

export interface Props{
    key_attrs: string[],
    samples: DataItem[],
    fetch_groups_status: Status
}
export interface State{

} 

export default class Attributes extends React.Component<Props, State>{
    public height= 100; bar_margin=1;attr_margin=8
    draw(){
        let {samples, key_attrs} = this.props

        let attrs = Object.keys(samples[0])
        // remove the attribute 'id' and 'class'
        attrs.splice(attrs.indexOf('id'), 1)
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

        let counts:number[] = [] // the height of each bar
        let attr_counts:number[] = [0] // the number of previous bars when start draw a new attr

        attrs.forEach(attr=>{
            let count = Object.values(
                countItem(samples.filter(s=>s.class=='0').map(s=>s[attr]))
                )
            counts = counts.concat(count)
            attr_counts.push(count.length + attr_counts[attr_counts.length-1])
        })
        let max_reject = Math.max(...counts)

        counts = []
        attrs.forEach(attr=>{
            let count = Object.values(
                countItem(samples.filter(s=>s.class=='1').map(s=>s[attr]))
                )
                counts = counts.concat(count)
        })
        let max_accept = Math.max(...counts)


        // let attr_w = Math.min (window.innerWidth/attrs.length - this.attr_margin, 60)
        let bar_w = (window.innerWidth*0.8 - attrs.length*this.attr_margin)/counts.length - this.bar_margin
        let bars = attrs.map((attr:string, attr_i)=>{
            let ranges = samples.map(d=>d[attr])
                        .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)
            let samples_reject = samples.filter((s)=>s.class==0)
            let samples_accept = samples.filter((s)=>s.class==1)
            // console.info(samples_accept, samples_reject)
            return <g key={attr} 
                        transform={`translate(${attr_counts[attr_i]*(bar_w+this.bar_margin) + attr_i*(this.attr_margin)}, ${2*this.attr_margin})`}
            >
                {/* bars */}
                {ranges.map((range:string, range_i)=>{
                    let accept_num = samples_accept.filter(s=>s[attr]===range).length
                    let reject_num = samples_reject.filter(s=>s[attr]===range).length
                    let accept_h = this.height/2*accept_num/max_accept
                    let reject_h = this.height/2*reject_num/max_reject

                    return <g key={`${attr}_${range}`} 
                            transform={`translate(${range_i*(bar_w+this.bar_margin)}, ${this.height/2})`}
                        >
                        <rect width={bar_w} height={accept_h} y={-1*accept_h} style={{fill: '#999' }}/>
                        <rect width={bar_w} height={reject_h} y={0} style={{fill: '#bbb'}}/>
                    </g>
                })}
                {/* label */}
                <text className='attrLabel' x={ranges.length*(bar_w+this.bar_margin)/2} y={2*this.attr_margin} 
                    transform="rotate(-30)" textAnchor='middle'
                >
                    {cutTxt(attr, ranges.length+1)}
                </text>
            </g>
        })

        /*******************************
         * protected attrs
        *******************************/
        let pie = d3.pie() // convert a list of values to format that can feed into arc generator
        let arc = d3.arc()
        .innerRadius(0) 
        .cornerRadius(1)
        .padAngle(0.1)// arc path generator

        const protect_attr = 'sex'
        const protect_vals = Object.keys(countItem(samples.map(s=>s[protect_attr])))

        let pies = protect_vals.map((protect_val, pie_i)=>{
            let subsamples = samples.filter(d=>d[protect_attr]==protect_val)
            let subsamples_count = Object.values(
                countItem( subsamples.map(s=>s.class) )
            )
            let radius = subsamples.length/samples.length*this.height/2

            // return a pie
            return <g key={protect_val+'_pie'} transform={`translate(${window.innerWidth*0.05*pie_i}, ${0})`}>
                {pie(subsamples_count).map((d:any,i)=>{
                let pathData = arc
                    .outerRadius(radius)(d)

                // return an arc
                return <path key={i} d={pathData||''} fill={getColor(protect_val)} opacity={0.4+i*0.4}/>
            })}
            <text>{protect_val}</text>
            </g>
        })
        

        return <g>
            <g className='attrs' transform={`translate(${window.innerWidth*0.15}, ${0})`}>
                {bars}
            </g>
            <g className='protect_attrs' transform={`translate(${window.innerWidth*0.01}, ${this.height/2})`}>
                {pies}
            </g>
        </g>
    }
    render(){
        let {fetch_groups_status} = this.props
        let content:JSX.Element = <g/>
        // if pending, then return a loading icon
        switch(fetch_groups_status){
            case Status.INACTIVE:
                content = <text x={window.innerWidth*.5} y='100' >
                            No Data
                        </text>
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

        return <g 
            className='Attributes' 
            transform={`translate(${window.innerWidth*0.01}, ${0})`}
        >
            {content}
        </g>
    }
}