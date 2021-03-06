
import { connect } from 'react-redux';

import EverythingScreen from '../components/everythingScreen';

const mapStateToProps = (state) => {
  return {
    playerOpen: state.bottomPlayer.playerOpen,
    tourStops: state.allTourStops.tourStops,
    currentStopUUID: state.bottomPlayer.stopUUID,
    screenReader: state.accessibility.screenReader,
    locale: state.localization.locale,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EverythingScreen);
