 import * as React from 'react';
 import './index.css';
 import Attributes from 'containers/Attributes';
 import Glyph from 'containers/Glyph';

 export default class AppMiddel extends React.Component{
     render(){
         return <div className='App-middle'>
            <svg className='svg' height='50%'>
                <Attributes/>
            </svg>
            <svg className='glyph' height='50%'>
                <Glyph/>
            </svg>
         
         </div>
     }
 }