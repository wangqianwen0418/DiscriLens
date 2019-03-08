import Resemble from 'components/AppMiddle/Resemble';
import { StoreState } from 'types';
import { connect} from 'react-redux';
//import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
        foldFlag: state.foldFlag
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Resemble);