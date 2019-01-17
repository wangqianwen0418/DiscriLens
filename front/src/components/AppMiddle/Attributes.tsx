import * as React from 'react';
import {DataItem, Status, KeyGroup} from 'types';
import {Icon} from 'antd';
import {countItem, cutTxt, getColor} from 'components/helpers';
import * as d3 from 'd3';

export interface Props{
    key_attrs: string[],
    samples: DataItem[],
    key_groups: KeyGroup[],
    fetch_groups_status: Status
}
export interface State{

} 

const drawBars= (attr:string, samples:DataItem[], 
    bar_w:number, bar_margin:number, max_accept:number,max_reject:number, height:number,
    offsetX=0, offsetY=0, highlightRange:string=''):JSX.Element=>{

    let ranges = samples.map(d=>d[attr])
                .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)
    let samples_reject = samples.filter((s)=>s.class==0)
    let samples_accept = samples.filter((s)=>s.class==1)
    // console.info(samples_accept, samples_reject)
    return <g key={attr} transform={`translate(${offsetX}, ${offsetY})`}>
        {/* bars */}
        {ranges.map((range:string, range_i)=>{
            let accept_num = samples_accept.filter(s=>s[attr]===range).length,
                reject_num = samples_reject.filter(s=>s[attr]===range).length,
                accept_h = height/2*accept_num/max_accept,
                reject_h = height/2*reject_num/max_reject,
                highlight = (range==highlightRange)


            return <g key={`${attr}_${range}`} 
                    transform={`translate(${range_i*(bar_w+bar_margin)}, ${height/2})`}
                >
                <rect width={bar_w} height={accept_h} y={-1*accept_h} style={{fill: highlight?'#DE4863':'#999' }}/>
                <rect width={bar_w} height={reject_h} y={0} style={{fill: highlight?'pink':'#bbb'}}/>
            </g>
        })}
        {/* label */}
    </g>
    
}

const drawPies = (values:number[], radius:number, color:string)=>{
    // convert a list of values to format that can feed into arc generator
    let pie = d3.pie() 
    // arc path generator
    let arc = d3.arc()
    .innerRadius(0) 
    .cornerRadius(1)

    return pie(values).map((d:any,i)=>{
        let pathData = arc
            .outerRadius(radius)(d)

        // return an arc
        return <path key={i} d={pathData||''} fill={color} opacity={0.4+i*0.4}/>
    })

}

export default class Attributes extends React.Component<Props, State>{
    public height= 100; bar_margin=1;attr_margin=8

    draw(){
        let {samples, key_attrs, key_groups} = this.props
        /*******************************
         * protected attrs
        *******************************/

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
                {drawPies(subsamples_count, radius, getColor(protect_val))}
            <text>{ (100*subsamples_count[1]/(subsamples_count[0]+subsamples_count[1])).toFixed(2)+'%' }</text>
            <text y={this.height/2} textAnchor='middle'>{`${protect_val}:${subsamples.length}`}</text>
            </g>
        })
        /*************  
         * attributes
         **************/ 

        let attrs = [...Object.keys(samples[0])]
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


        
        let bar_w = (window.innerWidth*0.8 - attrs.length*this.attr_margin)/counts.length - this.bar_margin
        let bars = attrs.map((attr:string, attr_i)=>{
            // offset x, y
            let offsetX = attr_counts[attr_i]*(bar_w+this.bar_margin) + attr_i*(this.attr_margin) 
            let offsetY = 0
            return <g key={attr} transform={`translate(${offsetX}, ${offsetY})`}>
             {
                 drawBars(attr, samples, bar_w, this.bar_margin, max_accept, max_reject,this.height)
             }
                <text className='attrLabel' x={0} y={2*this.bar_margin} 
                    transform="rotate(-30)" textAnchor='middle'
                >
                    {cutTxt(attr, attr_counts[attr_i+1]- attr_counts[attr_i]+1)}
                </text>
            </g>
        })

        let rule_bars = key_groups.map((group, group_i)=>{
            let groupSamples = samples.filter(d=>{
                return group.items.indexOf(d.id)!=-1
            })

            let groupPies = protect_vals.map((protect_val, pie_i)=>{
                let subsamples = groupSamples.filter(d=>d[protect_attr]==protect_val)
                let subsamples_count = Object.values(
                    countItem( subsamples.map(s=>s.class) )
                )
                let radius = subsamples.length/groupSamples.length*this.height/2
                // return a pie
                return <g key={protect_val+'_pie'} transform={`translate(${window.innerWidth*0.25+window.innerWidth*0.15*pie_i}, ${0})`}>
                    {drawPies(subsamples_count, radius, getColor(protect_val))}
                <text>{ (100*subsamples_count[1]/(subsamples_count[0]+subsamples_count[1])).toFixed(2)+'%' }</text>
                <text y={this.height/2} textAnchor='middle'>{`${protect_val}:${subsamples.length}`}</text>
                </g>
            })

            let groupBars = attrs.filter(attr=>key_attrs.indexOf(attr)!=-1).map((attr, attr_i)=>{
                let offsetX = attr_counts[attr_i]*(bar_w+this.bar_margin) + attr_i*(this.attr_margin) 
                let offsetY = 0
                return <g key={attr} transform={`translate(${offsetX}, ${offsetY})`}>
                    {
                    drawBars(attr, samples, bar_w, this.bar_margin, max_accept, max_reject,this.height, 0, 0, group[attr])
                    }
                    <text>{group[attr]}</text>
                    </g>
                })
    
            return <g key={`group_${group_i}`} transform={`translate(${0}, ${this.height*(group_i+1)})`}>
                {groupBars}
                {groupPies}
            </g>

        }) 

        
        

        return <g>
            <g className='attrs' transform={`translate(${window.innerWidth*0.15}, ${this.attr_margin*2})`}>
                {bars}
                {rule_bars}
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