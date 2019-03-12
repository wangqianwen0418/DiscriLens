import ModelSelection from 'components/AppMiddle/ModelSelection';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { switchModel,ChangeXSclaeMax,switchCompModel,ChangeFoldFlag} from 'actions';

export function mapStateToProps(state:StoreState) {
    return {
        showDataset: state.showDataset,
        allRules: state.allRules,
        dragArray: state.dragArray,
        keyAttrNum: state.keyAttrNum,
        accuracy: state.accuracy,
    };
}

export function mapDispatchToProps(dispatch:any) {
    return {
        onChangeXScaleMax:(xScaleMax:number)=>{dispatch(ChangeXSclaeMax(xScaleMax))},
        onChangeModel:(dataset:string,model:string)=>{dispatch(switchModel(dataset,model))},
        onChangeCompModel:(dataset:string,model:string)=>{dispatch(switchCompModel(dataset,model))},
        onChangeFoldFlag:(foldFlag:boolean)=>{dispatch(ChangeFoldFlag(foldFlag))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ModelSelection);