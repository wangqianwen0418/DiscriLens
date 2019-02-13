 import * as React from 'react';
 import './index.css';
 import Attributes from 'containers/Attributes';
 import Itemsets from 'containers/Itemsets';

 export default class AppMiddel extends React.Component{
     render(){
         return <div className='App-middle'>
            <svg className='attribute'>
                <Attributes/>
            </svg>
            <svg className='itemset'>
                <Itemsets/>
            </svg>
         
         </div>
     }
 }