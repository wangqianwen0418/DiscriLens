import Samples from 'components/Samples';
import { StoreState } from 'types';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    // console.info(state.samples)
    return {
        samples: state.samples,
        featchSampleStatus: state.fetchSampleStatus
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Samples);