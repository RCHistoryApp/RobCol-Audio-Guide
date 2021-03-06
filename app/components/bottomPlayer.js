import React, { Component, PropTypes } from 'react';

import { StyleSheet, Dimensions, View } from 'react-native';

import I18n from 'react-native-i18n';

import { screenReaderReloadLayout } from '../actions/accessibility';

import { analyticsTrackAudioCompleteListen } from '../actions/analytics';

import {
  PLAYER_STATUS_FINISHED,
  PLAYER_STATUS_ERROR,
  PLAYER_STATUS_NOTLOADED,
  PLAYER_STATUS_UNLOADED,
  PLAYER_STATUS_LOADING,
  PLAYER_STATUS_PLAY,
} from '../actions/audio';

import ControlsView from './controlsView';
import TimeProgressView from './timeProgressView';
import AutoplayProgressView from './autoplayProgressView';
import ClosePlayerView from './closePlayerView';

import { BOTTOMBARHEIGHT } from './rootScreen';

import { OFF_BLACK } from '../styles';

export const BOTTOMPLAYERHEIGHT = 95;

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    borderBottomWidth: 1,
    borderColor: '#0d0d0d',
    backgroundColor: '#1A1A1A',
  },
});

function nextAudioProps(audioContent, nextUUID, defaultTitle) {
  if (nextUUID !== null) {
    const audio = audioContent.filtered(`uuid = "${nextUUID}"`)[0];

    return {
      code: audio.title,
      highlight: audio.category === 'HIGHLIGHT',
    };
  }

  return defaultTitle;
}

class BottomPlayer extends Component {
  static propTypes = {
    tourStop: PropTypes.object.isRequired,
    stopUUID: PropTypes.string.isRequired,
    currentUUID: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    navToTourStop: PropTypes.func.isRequired,
    prevUUID: PropTypes.string,
    nextUUID: PropTypes.string,
    stopTitle: PropTypes.string.isRequired,
    audioTitle: PropTypes.string.isRequired,
    audioContent: PropTypes.object.isRequired,
    duration: PropTypes.number.isRequired,
    time: PropTypes.number.isRequired,
    playRate: PropTypes.string.isRequired,
    playerStatus: PropTypes.string.isRequired,
    timerActive: PropTypes.bool.isRequired,
    timerStartAt: PropTypes.number.isRequired,
    timerNumber: PropTypes.number.isRequired,
    autoplayOn: PropTypes.bool.isRequired,
    locale: PropTypes.string.isRequired,
    actions: PropTypes.shape({
      playTrack: PropTypes.func.isRequired,
      togglePausePlay: PropTypes.func.isRequired,
      replayAudio: PropTypes.func.isRequired,
      rewindAudio: PropTypes.func.isRequired,
      cycleAudioSpeed: PropTypes.func.isRequired,
      unloadAudio: PropTypes.func.isRequired,
      playAudio: PropTypes.func.isRequired,
    }).isRequired,
  };

  componentWillReceiveProps(nextProps) {
    if (
      this.props.playerStatus === PLAYER_STATUS_LOADING &&
      nextProps.playerStatus === PLAYER_STATUS_PLAY
    ) {
      this.props.actions.playAudio();
      return;
    }

    if (nextProps.playerStatus === PLAYER_STATUS_FINISHED) {
      const { audioContent, index } = this.props;

      const activeAudio = audioContent[index];
      let url = activeAudio.audioURL;

      if (activeAudio.audioURL.length === 3) {
        // If available, play audio in chosen language. Else play audio in fallback language. Else play audio in Swedish.
        if (activeAudio.duration[I18n.locale]) {
          url = activeAudio.audioURL.concat('/', I18n.locale);
        } else {
          if (activeAudio.duration[I18n.defaultLocale]) {
            url = activeAudio.audioURL.concat('/', I18n.defaultLocale);
          } else {
            url = activeAudio.audioURL.concat('/', 'sv');
          }
        }
      }

      const audioLanguage = url.split('/')[1];
      analyticsTrackAudioCompleteListen(this.props.locale, audioLanguage, this.props.audioTitle);
    }
  }

  render() {
    const {
      tourStop,
      index,
      navToTourStop,
      nextUUID,
      prevUUID,
      stopTitle,
      audioTitle,
      audioContent,
      time,
      duration,
      playRate,
      playerStatus,
      timerActive,
      timerStartAt,
      timerNumber,
      autoplayOn,
      locale,
    } = this.props;

    const {
      togglePausePlay,
      rewindAudio,
      cycleAudioSpeed,
      unloadAudio,
      replayAudio,
      playTrack,
    } = this.props.actions;

    // Force the screen reader to update with bottom player
    screenReaderReloadLayout();

    const width = Dimensions.get('window').width;

    if (
      playerStatus === PLAYER_STATUS_ERROR ||
      playerStatus === PLAYER_STATUS_NOTLOADED ||
      playerStatus === PLAYER_STATUS_LOADING ||
      playerStatus === PLAYER_STATUS_UNLOADED
    ) {
      // We don't want the bottom player:
      return null;
    }

    let progress;

    if (playerStatus === PLAYER_STATUS_FINISHED && nextUUID === null) {
      return (
        <View
          style={[
            styles.bottomBar,
            {
              width,
              height: BOTTOMPLAYERHEIGHT,
              bottom: BOTTOMBARHEIGHT,
            },
          ]}
        >
          <ClosePlayerView
            stopTitle={stopTitle}
            closePlayer={() => {
              unloadAudio();
            }}
            navToTourStop={() => {
              navToTourStop();
            }}
          />
        </View>
      );
    } else if (playerStatus === PLAYER_STATUS_FINISHED && nextUUID !== null) {
      // display the autoplay progress
      progress = (
        <AutoplayProgressView
          time={time}
          duration={duration}
          playerStatus={playerStatus}
          timerActive={timerActive}
          timerStartAt={timerStartAt}
          timerNumber={timerNumber}
          autoplayOn={autoplayOn}
          nextUUID={nextUUID}
          actions={{
            loadNextAutoplayAudio: () => {
              playTrack(tourStop, nextUUID, true);
            },
          }}
        />
      );
    } else {
      // display the time progress
      progress = <TimeProgressView time={time} duration={duration} />;
    }

    let prevDisabled = false;
    let nextDisabled = false;

    if (index - 1 < 0) {
      prevDisabled = true;
    }
    if (index + 1 >= audioContent.length) {
      nextDisabled = true;
    }

    return (
      <View
        style={[
          styles.bottomBar,
          {
            width,
            height: BOTTOMPLAYERHEIGHT,
            bottom: BOTTOMBARHEIGHT,
            backgroundColor: OFF_BLACK,
          },
        ]}
        // Rerender when PLAYER_STATUS_FINISHED begins and ends
        key={playerStatus === PLAYER_STATUS_FINISHED}
      >
        {progress}
        <ControlsView
          highlight={audioContent[index].category === 'HIGHLIGHT'}
          stopTitle={stopTitle}
          audioCode={audioTitle}
          nextAudioProps={nextAudioProps(audioContent, nextUUID, audioTitle)}
          time={time}
          playerStatus={playerStatus}
          prevDisabled={prevDisabled}
          nextDisabled={nextDisabled}
          playRate={playRate}
          autoplayOn={autoplayOn}
          locale={locale}
          actions={{
            togglePausePlay,
            replayAudio,
            rewindAudio,
            cycleAudioSpeed,
            navToTourStop,
            loadNextAudio: () => {
              playTrack(tourStop, nextUUID, false);
            },
            loadNextAutoplayAudio: () => {
              playTrack(tourStop, nextUUID, true);
            },
            loadPrevAudio: () => {
              playTrack(tourStop, prevUUID, false);
            },
          }}
        />
      </View>
    );
  }
}

export default BottomPlayer;
