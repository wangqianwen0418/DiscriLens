 import * as React from 'react';
 import './index.css';
 import Attributes from 'containers/Attributes'
 import SetCover from 'containers/SetCover'

 export default class AppMiddel extends React.Component{
     render(){
         return <div className='App-middle'>
         <svg className='svg'>
            <Attributes/>
            <SetCover/>
        </svg>
         </div>
     }
 }