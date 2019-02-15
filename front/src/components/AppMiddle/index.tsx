 import * as React from 'react';
 import './index.css';
 import Attributes from 'containers/Attributes';
 import Itemsets from 'containers/Itemsets';

 export default class AppMiddel extends React.Component{
     public step = 120;
     bar_w = this.step * 0.9
     render(){
         return <div className='App-middle'>
            <svg className='attribute' style={{width:"100%", height: "40%"}}>
                <Attributes step={this.step} bar_w={this.bar_w}/>
            </svg>
            <div className='itemset' style={{width: "100%", height: "50%", overflowY: "scroll"}}>
                <Itemsets step={this.step} bar_w={this.bar_w}/>
            </div>
         </div>
     }
 }