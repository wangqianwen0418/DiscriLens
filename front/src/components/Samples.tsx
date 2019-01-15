import * as React from 'react';
// import {Table} from 'antd';
import {DataItem} from 'types';
import './Samples.css';

export interface IProps{
 samples: DataItem[]
}

export interface IState{

}
export default class Samples extends React.Component<IProps, IState>{
    public render(){
        let {samples} = this.props
        console.info(samples)
        if (samples.length>0){
            let columns = Object.keys(samples[0])
            return <div className='samples'>
            <table>
                {/* header */}
                <tr>{columns.map(d=>{ return <th key={d}>{d}</th> })}</tr>
                {/* table body */}
                {samples.map((sample:DataItem, i:number)=>{
                    return <tr key={`id_${i}`}> 
                    {columns.map(k=>{
                        return <td key={`id_${i}_attr_${k}`}>
                            {sample[k]}
                        </td>
                    })}
                    </tr>
                })}
            </table>
            </div>
        }else{
            return <div className='samples' >
            No sample
            </div>
        }
        
    }
}

