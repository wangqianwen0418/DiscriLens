import * as React from 'react';
import {DataItem, Status, KeyGroup} from 'types';
import {Icon} from 'antd';
import {countItem, cutTxt, getColor, getRadius} from 'components/helpers';
import * as d3 from 'd3';

//import { line, range } from 'd3';

export interface Props{
    key_attrs: string[],
    samples: DataItem[],
    key_groups: KeyGroup[],
    num_attrs: string[],
    fetch_groups_status: Status
} 
export interface State{

} 

export interface curveData{
    x: number,
    y: number,
    z: number
}

const drawBars= (attr:string, samples:DataItem[], 
    bar_w:number, bar_margin:number, max_accept:number,max_reject:number, height:number,
    offsetX=0, offsetY=0, highlightRange:string=''):JSX.Element=>{
    let ranges = samples.map(d=>d[attr])
                .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)
    let samples_reject = samples.filter((s)=>s.class==0)
    let samples_accept = samples.filter((s)=>s.class==1)
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

const drawCurves = (attr: string, samples: DataItem[],height: number, curveFlag: boolean, highlightRange:string ,offsetX=0, offsetY=0,)=>{
    let ranges = samples.map(d=>d[attr])
                .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i) 
                .sort((a:number,b:number) => a - b)
    let ListNum : curveData[] = []
    let samples_reject = samples.filter((s)=>s.class==0)
    let samples_accept = samples.filter((s)=>s.class==1)
    let xRecord = 0
    let yRecord = [0,0]
    function getStep(){
        if(ranges.length<20){return 2}
        else{return 4}
    }
    let step = getStep()
    const dataPush = (x:number,y:number,z:number):curveData => {return {x,y,z}}
    let accept_num = 0,
        reject_num = 0
    ranges.map((range:number,range_i)=>{
        if(((range_i%step==0)&&(range_i!=0))||(range_i==ranges.length - 1)||((range_i==0))){
            ListNum.push(dataPush(range,accept_num,reject_num))
            xRecord = Math.max(xRecord,range)
            yRecord = [Math.max(yRecord[0],accept_num),Math.max(yRecord[1],reject_num)]
            accept_num = 0
            reject_num = 0
        }
        else{
            accept_num += samples_accept.filter(s=>s[attr]===range).length
            reject_num += samples_reject.filter(s=>s[attr]===range).length
        }
    })
    let xScale = d3.scaleLinear().domain([0,xRecord]).range([0,Math.max(50,xRecord)])
    let yScaleAcc = d3.scaleLinear().domain([0,yRecord[0]]).range([height/2,0]);
    let yScaleRej = d3.scaleLinear().domain([0,yRecord[1]]).range([height/2,height]);

    const areasAcc = d3.area<curveData>().x(d=>xScale(d.x)).y1(height/2).y0(d=>yScaleAcc(d.y)).curve(d3.curveMonotoneX)
    const areasRej = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>yScaleRej(d.z)).y0(height/2).curve(d3.curveMonotoneX)

    if(curveFlag){
        let xRange = [0,0]
        let numbers = highlightRange.match(/\d+/g).map(Number)
        if(numbers.length==2){xRange = [numbers[0],numbers[1]]}
        else if(highlightRange.includes('>')){xRange = [numbers[0],xRecord]}
        else{xRange = [0,numbers[0]]}
        const areasAccSelect = d3.area<curveData>().x(d=>xScale(d.x)).y1(height/2).y0(d=>yScaleAcc(d.y)).curve(d3.curveMonotoneX)
        const areasRejSelect = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>yScaleRej(d.z)).y0(height/2).curve(d3.curveMonotoneX)
        let ListNumFilter = ListNum.filter((s)=>{
            if((s.x>xRange[0])&&(s.x<=xRange[1]+1)){return s}
            else{return null}})
        //console.log(ranges,ListNum,highlightRange,xRange,ListNumFilter)
        return <g key={attr + 'curve'} transform={`translate(${offsetX}, ${offsetY})`}>
        <path d={areasAcc(ListNum)||''} style={{fill:'#999'}}/>
        <path d={areasAccSelect(ListNumFilter)||''} style={{fill:'#DE4863'}}/>
        <path d={areasRej(ListNum)||''} style={{fill:'#bbb'}}/>
        <path d={areasRejSelect(ListNumFilter)||''} style={{fill:'pink'}}/>
    </g>
    }
    

    return <g key={attr + 'curve'} transform={`translate(${offsetX}, ${offsetY})`}>
        <path d={areasAcc(ListNum)||''} style={{fill:'#999'}}/>   
        <path d={areasRej(ListNum)||''} style={{fill:'#bbb'}}/>
    </g>

}
const drawPies = (values:number[], radius:number, color:string, innerRadius:number)=>{
    // convert a list of values to format that can feed into arc generator
    let pie = d3.pie()
    // arc path generator
    let arc = d3.arc()
    .cornerRadius(1)

    return pie(values).map((d:any,i)=>{
        let pathData = arc
            .innerRadius(innerRadius)
            .outerRadius(radius)(d)
        // return an arc
        return <path key={i} d={pathData||''} fill={color} opacity={0.4+i*0.4}/>
    })

}


export default class Attributes extends React.Component<Props, State>{
    public height= 70; bar_margin=1;attr_margin=8;viewSwitch=1;
    
    draw(){
        let {samples, key_attrs, key_groups, num_attrs} = this.props
        /*******************************
         * protected attrs
        *******************************/
        console.log(num_attrs)
        const protect_attr = 'sex'
        const protect_vals = Object.keys(countItem(samples.map(s=>s[protect_attr])))

        let pies = protect_vals.map((protect_val, pie_i)=>{
            let subsamples = samples.filter(d=>d[protect_attr]==protect_val)
            let subsamples_count = Object.values(
                countItem( subsamples.map(s=>s.class) )
            )
            let radius = subsamples.length/samples.length*this.height/2

            // return a pie
            return <g key={protect_val+'_pie'} transform={`translate(${window.innerWidth*0.05*pie_i+20}, ${0})`}>
                {drawPies(subsamples_count, radius, getColor(protect_val), 0)}
            <text>{ (100*subsamples_count[1]/(subsamples_count[0]+subsamples_count[1])).toFixed(2)+'%' }</text>
            <text y={this.height/2} textAnchor='middle'>{`${protect_val}:${subsamples.length}`}</text>
            </g>
        })
        /*************  
         * attributes
         **************/ 

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


        
        let bar_w = 5//(window.innerWidth*0.8 - attrs.length*this.attr_margin)/counts.length - this.bar_margin
        let bars = attrs.map((attr:string, attr_i)=>{
            // offset x, y
            let offsetX = attr_counts[attr_i]*(bar_w+this.bar_margin) + attr_i*(this.attr_margin) 
            let offsetY = 0
            let dataType = typeof samples.map(d=>d[attr])
            .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)[0]
            if(dataType=='string'){
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
            }
            else{
                return <g key={attr + 'curves'} transform={`translate(${offsetX+50}, ${offsetY})`}>
                {
                    drawCurves(attr, samples,this.height,false,'')
                }
                </g>
            }
        })

        let rule_bars = key_groups.map((group, group_i)=>{
            let groupSamples = samples.filter(d=>{
                return group.items.indexOf(d.id)!=-1
            })

            let radiusF = 0 // record the former radius to prevent gap between inner circle and outer circle
            let textF = ''
            let ratioF = ''
            let groupPies = protect_vals.map((protect_val, pie_i)=>{
                //console.log(protect_val,'/',pie_i,'/',group_i)
                let subsamples = groupSamples.filter(d=>d[protect_attr]==protect_val)
                let subsamples_count = Object.values(
                    countItem( subsamples.map(s=>s.class) )
                )
                let radius = subsamples.length/groupSamples.length*this.height/2
                if(pie_i == 0){
                     radiusF = radius
                     textF = `${protect_val}:${subsamples.length}`
                     ratioF = (100*subsamples_count[1]/(subsamples_count[0]+subsamples_count[1])).toFixed(2)+'%'
                }
                // return a pie
                let offsetX = window.innerWidth / 5 + group_i % 5 * window.innerWidth / 10;
                let offsetY = this.height * (Math.floor(group_i / 5) + 1.5);
                return <g key={protect_val+'_pie'} transform={`translate(${offsetX}, ${offsetY})`}>
                    {drawPies(subsamples_count, getRadius(protect_val, radius, radiusF).outerRadius, getColor(protect_val), getRadius(protect_val, radius, radiusF).innerRadius)}
                <text>{pie_i==1?ratioF+'/'+(100*subsamples_count[1]/(subsamples_count[0]+subsamples_count[1])).toFixed(2)+'%':'' }</text>
                <text y={this.height/3 + 5} textAnchor='middle'>{pie_i==1?`${textF}/${protect_val}:${subsamples.length}`:''}</text>
                </g>
            })
            
            let groupBars = attrs.filter(attr=>key_attrs.indexOf(attr)!=-1).map((attr, attr_i)=>{
                let offsetX = attr_counts[attr_i]*(bar_w+this.bar_margin) + group_i % 5 * window.innerWidth / 3
                let offsetY = this.height * (Math.floor(group_i / 5) + 1.5);
                let dataType = typeof samples.map(d=>d[attr])
                .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)[0]
                if(dataType=='string'){
                    return <g key={attr} transform={`translate(${offsetX}, ${offsetY})`}>
                        {
                        drawBars(attr, samples, bar_w, this.bar_margin, max_accept, max_reject,this.height, 0, 0, group[attr])
                        }
                        <text transform={`translate(${0}, ${this.height})`}>{group[attr]}</text>
                        </g>
                }
                else{
                    return <g key={attr + 'curves'} transform={`translate(${offsetX+50}, ${offsetY})`}>
                    {
                        drawCurves(attr, samples,this.height,true, group[attr])
                    }
                </g>
                }
            })
            if(group_i==0){
                if(this.viewSwitch==0){ 
                    return <g key={`group_${group_i}`}>
                    {groupPies}
                </g>
                } else if(this.viewSwitch==1){
                    return <g key={`group_${group_i}`}>
                    {groupBars}
                </g>
                } else{
                    return <g key={`group_${group_i}`}>
                    {groupPies}
                    {groupBars}
                </g>
                }
            }
            else{return <g></g>}
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
        //console.log(this.props)
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
            className='Attributes' 
            transform={`translate(${window.innerWidth*0.01}, ${0})`}
        >
            {content}
        </g>

        
    )}
}