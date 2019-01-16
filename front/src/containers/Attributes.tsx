import Attributes from 'components/AppMiddle/Attributes';
import { StoreState } from 'types';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState, ownProps?:any) {
    // console.info(state.samples)
    return {
        samples: state.samples,
        key_attrs: state.key_attrs,
        fetch_groups_status: state.fetch_groups_status
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Attributes);