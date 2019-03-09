import Itemsets from 'components/AppMiddle/Itemsets';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeShowAttr,ChangeSelectedBar} from 'actions';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
        ruleThreshold: state.ruleThreshold,
        keyAttrNum:state.keyAttrNum,
        dragArray: state.dragArray, 
        protectedVal: state.protectedVal,
        showAttrNum: state.showAttrNum,
        fetchKeyStatus: state.fetchKeyStatus
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onChangeShowAttr: (showAttrs: string[])=>dispatch(ChangeShowAttr(showAttrs)),
        // onChangeDragArray: (dragArray: string[])=>(dispatch(ChangeDragArray(dragArray)))
        onChangeSelectedBar: (selected_bar:string[])=>dispatch(ChangeSelectedBar(selected_bar))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Itemsets);
