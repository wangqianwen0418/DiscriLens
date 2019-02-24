import ModelSelection from 'components/AppMiddle/ModelSelection';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { switchModel,ChangeXSclaeMax} from 'actions';

export function mapStateToProps(state:StoreState) {
    return {
        showDataset: state.showDataset,
        allRules: state.allRules,
        dragArray: state.dragArray,
        keyAttrNum: state.keyAttrNum,
    };
}

export function mapDispatchToProps(dispatch:any) {
    return {
        onChangeXScaleMax:(xScaleMax:number)=>{dispatch(ChangeXSclaeMax(xScaleMax))},
        onChangeModel:(dataset:string,model:string)=>{dispatch(switchModel(dataset,model))},
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ModelSelection);