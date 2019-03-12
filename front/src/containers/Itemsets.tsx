import Itemsets from 'components/AppMiddle/Itemsets';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeShowAttr,ChangeSelectedBar,TransCompareList} from 'actions';
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
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onChangeShowAttr: (showAttrs: string[])=>dispatch(ChangeShowAttr(showAttrs)),
        // onChangeDragArray: (dragArray: string[])=>(dispatch(ChangeDragArray(dragArray)))
        onChangeSelectedBar: (selected_bar:string[])=>dispatch(ChangeSelectedBar(selected_bar)),
        onTransCompareList :(compareList:{b1:rect[],b2:rect[],r:number[]})=>dispatch(TransCompareList(compareList)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Itemsets);
