 import * as React from 'react';
 import './index.css';
 import Attributes from 'containers/Attributes';
 import Itemsets from 'containers/Itemsets';
 import Overview from 'containers/Overview';

 export default class AppMiddel extends React.Component{
     public step = 120;
     bar_w = this.step * 0.9;
     offsetX=110;
     render(){

         return <div className='App-middle'> 

          <div className='App-left' id='App-left'>
            <svg className='overview'>
              <Overview/>
            </svg>
          </div>

          <div className='App-right'>
          <svg className='attribute' style={{width:"100%", height: "25%"}}>
                <Attributes step={this.step} bar_w={this.bar_w} offsetX={this.offsetX}/>
            </svg>
            <div className='itemset' style={{width: "100%", height: "75%", overflowY: "scroll"}}>
                <Itemsets step={this.step} bar_w={this.bar_w} offsetX={this.offsetX}/>
            </div>
        </div>
        </div>
     }
 }