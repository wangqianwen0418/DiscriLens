import Resemble from 'components/AppMiddle/Resemble';
import { StoreState } from 'types';
import { connect} from 'react-redux';
//import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
        foldFlag: state.foldFlag,
        compSamples:state.compSamples,
        rules: state.rules,
        samples: state.samples,
        compRules:state.compRules,
        compareFlag:state.compareFlag,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Resemble);