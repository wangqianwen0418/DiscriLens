import ComparePrime from 'components/AppMiddle/ComparePrime';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeShowAttr,ChangeSelectedBar,TransCompareList,TransExpandRule} from 'actions';
// import { Dispatch } from 'redux';
export interface rect {
    x: number,
    y: number,
    w: number,
    h: number,
}
export function mapStateToProps(state:StoreState) {
    return {
        ruleThreshold: state.ruleThreshold,
        keyAttrNum:state.keyAttrNum,
        dragArray: state.dragArray, 
        protectedVal: state.protectedVal,
        showAttrNum: state.showAttrNum,
        fetchKeyStatus: state.fetchKeyStatus,
        compareList: state.compareList,
        compareOffset:state.compareOffset,
        unMatchedRules:state.unMatchedRules,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onChangeShowAttr: (showAttrs: string[])=>dispatch(ChangeShowAttr(showAttrs)),
        // onChangeDragArray: (dragArray: string[])=>(dispatch(ChangeDragArray(dragArray)))
        onChangeSelectedBar: (selected_bar:string[])=>dispatch(ChangeSelectedBar(selected_bar)),
        onTransCompareList :(compareList:{b2:rect[],r:{y:number,r:string[]}[],p:number,yMax:any})=>dispatch(TransCompareList(compareList)),
        onTransExpandRule:(expandRule:{id: number, newAttrs: string[], children: string[]})=>dispatch(TransExpandRule(expandRule))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ComparePrime);
