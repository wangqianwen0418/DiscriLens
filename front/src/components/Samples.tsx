import * as React from 'react';
import {Icon} from 'antd';
import {DataItem, Status} from 'types';
import './Samples.css';

export interface IProps{
 samples: DataItem[],
 featchSampleStatus: Status
}

export interface IState{

}
export default class Samples extends React.Component<IProps, IState>{
    public render(){
        let {samples, featchSampleStatus} = this.props
        samples = samples.slice(0,Math.floor(samples.length/2))
        // console.info(featchSampleStatus)
        if (featchSampleStatus==Status.PENDING){
            return <div className='samples' >
            <Icon 
                type="sync" 
                spin={true} 
                style={{fontSize: '40px', margin: '10px'}}
            />
            </div>
        }else if(samples.length>0){
            let columns = Object.keys(samples[0])
            return<div className='samples' data-step='2' data-intro='data sample details'>
            <table>
                {/* header */}
                <thead>
                <tr>{columns.map(d=>{ return <th key={d}>{d}</th> })}</tr>
                </thead>
                {/* table body */}
                <tbody>
                {samples.map((sample:DataItem, i:number)=>{
                    return <tr key={`id_${i}`}> 
                    {columns.map(k=>{
                        return <td key={`id_${i}_attr_${k}`}>
                            {sample[k]}
                        </td>
                    })}
                    </tr>
                })}
                </tbody>
            </table>
            </div>
            }else{
            return <div className='samples' >
            No Data
            </div>
        }
        
    }
}

