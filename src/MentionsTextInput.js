import React, { Component } from 'react';
import {
  Text,
  View,
  Animated,
  TextInput,
  FlatList,
  ViewPropTypes,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
  },
  textInput: {
    borderColor: '#ebebeb',
    borderWidth: 1,
    fontSize: 15,
  },
  suggestionsPanel: {
    backgroundColor: 'rgba(100,100,100,0.1)',
  },
});

export default class MentionsTextInput extends Component {
  constructor() {
    super();
    this.state = {
      isTrackingStarted: false,
      suggestionRowHeight: new Animated.Value(0),

    }
    this.isTrackingStarted = false;
    this.previousChar = " ";
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.value) {
      this.resetTextbox();
    } else if (this.isTrackingStarted && !nextProps.horizontal && nextProps.suggestionsData.length !== 0) {
      const numOfRows = nextProps.MaxVisibleRowCount >= nextProps.suggestionsData.length ? nextProps.suggestionsData.length : nextProps.MaxVisibleRowCount;
      const height = numOfRows * nextProps.suggestionRowHeight;
      this.openSuggestionsPanel(height);
    }
  }

  startTracking() {
    this.isTrackingStarted = true;
    this.openSuggestionsPanel();
    this.setState({
      isTrackingStarted: true
    })
  }

  stopTracking() {
    this.isTrackingStarted = false;
    this.closeSuggestionsPanel();
    this.setState({
      isTrackingStarted: false
    })
  }

  openSuggestionsPanel(height) {
    Animated.timing(this.state.suggestionRowHeight, {
      toValue: height ? height : this.props.suggestionRowHeight,
      duration: 100,
    }).start();
  }

  closeSuggestionsPanel() {
    Animated.timing(this.state.suggestionRowHeight, {
      toValue: 0,
      duration: 100,
    }).start();
  }

  updateSuggestions(lastKeyword) {
    this.props.triggerCallback(lastKeyword);
  }

  identifyKeyword(val) {
    if (this.isTrackingStarted) {
      const boundary = this.props.triggerLocation === 'new-word-only' ? 'B' : '';
      const pattern = new RegExp(`\\${boundary}${this.props.trigger}[a-z0-9_-]+|\\${boundary}${this.props.trigger}`, `gi`);
      const keywordArray = val.match(pattern);
      if (keywordArray && !!keywordArray.length) {
        const lastKeyword = keywordArray[keywordArray.length - 1];
        this.updateSuggestions(lastKeyword);
      }
    }
  }

  onChangeText(val) {
    this.props.onChangeText(val); // pass changed text back
    const lastChar = val.substr(val.length - 1);
    const wordBoundry = (this.props.triggerLocation === 'new-word-only') ? this.previousChar.trim().length === 0 : true;
    if (lastChar === this.props.trigger && wordBoundry) {
      this.startTracking();
    } else if (lastChar === ' ' && this.state.isTrackingStarted || val === "") {
      this.stopTracking();
    }
    this.previousChar = lastChar;
    this.identifyKeyword(val);
  }

  resetTextbox() {
    this.previousChar = " ";
    this.stopTracking();
  }

  render() {
    return (
      <View style={this.props.wrapStyle}>
        <Animated.View style={[{ ...this.props.suggestionsPanelStyle }, { height: this.state.suggestionRowHeight }]}>
          <FlatList
            keyboardShouldPersistTaps={"always"}
            horizontal={this.props.horizontal}
            ListEmptyComponent={this.props.loadingComponent}
            enableEmptySections={true}
            data={this.props.suggestionsData}
            keyExtractor={this.props.keyExtractor}
            renderItem={(rowData) => { return this.props.renderSuggestionsRow(rowData, this.stopTracking.bind(this)) }}
          />
        </Animated.View>
        <TextInput
          {...this.props}
          ref={component => this._textInput = component}
          onChangeText={this.onChangeText.bind(this)}
          value={this.props.value}
          style={this.props.textInputStyle}
          placeholder={this.props.placeholder ? this.props.placeholder : 'Write a comment...'}
        />
      </View>
    )
  }
}

MentionsTextInput.propTypes = {
  loadingComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.element,
  ]),
  trigger: PropTypes.string.isRequired,
  triggerLocation: PropTypes.oneOf(['new-word-only', 'anywhere']).isRequired,
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  triggerCallback: PropTypes.func.isRequired,
  renderSuggestionsRow: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.element,
  ]).isRequired,
  suggestionsData: PropTypes.array.isRequired,
  keyExtractor: PropTypes.func.isRequired,
  horizontal: PropTypes.bool,
  suggestionRowHeight: PropTypes.number.isRequired,
  MaxVisibleRowCount: function (props, propName, componentName) {
    if (!props.horizontal && !props.MaxVisibleRowCount) {
      return new Error(
        `Prop 'MaxVisibleRowCount' is required if horizontal is set to false.`
      );
    }
  }
};

MentionsTextInput.defaultProps = {
  wrapStyle: styles.wrap,
  textInputStyle: styles.textInput,
  suggestionsPanelStyle: styles.suggestionsPanel,
  loadingComponent: () => <Text>Loading...</Text>,
  horizontal: true,
}
