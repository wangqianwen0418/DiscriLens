import Itemsets from 'components/AppMiddle/Itemsets';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeShowAttr} from 'actions';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
        rules: state.rules,
        samples: state.samples,
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
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Itemsets);
