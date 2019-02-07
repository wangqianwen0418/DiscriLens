 import * as React from 'react';
 import './index.css';
 import Attributes from 'containers/Attributes';
 import Glyph from 'containers/Glyph';

 export default class AppMiddel extends React.Component{
     render(){
         return <div className='App-middle'>
            <svg className='svg'>
                <Attributes/>
            </svg>
            <svg className='glyph'>
                <Glyph/>
            </svg>
         
         </div>
     }
 }