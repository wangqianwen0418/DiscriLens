 import * as React from 'react';
 import './index.css';
 import Attributes from 'containers/Attributes';
 import Glyph from 'containers/Glyph';
 import Overview from 'containers/Overview'

 export default class AppMiddel extends React.Component{
     render(){

         return <div className='App-middle'> 

          <div className='App-left' id='App-left'>
            <svg>
              <Overview/>
            </svg>
          </div>

          <div className='App-right'>
            <svg className='svg_attribute'>
                <Attributes/>
            </svg>
            <svg className='svg_itemset'>
                <Glyph/>
            </svg>
          </div>
        </div>
     }
 }