// noinspection JSUnusedLocalSymbols

import React, { RefAttributes, RefObject, useRef } from 'react';
import {
  Dimensions,
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewProps,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  gestureHandlerRootHOC,
  PanGesture,
  ScrollView,
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';
import Animated, { AnimateProps, useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { NativeViewGestureHandlerProps } from 'react-native-gesture-handler/src/handlers/NativeViewGestureHandler';
import { Footer, Header, ScrollViewContent } from './util/Test';
import usePullToNextHelperRef, { PageItem, PullTuNextHelper, useAnimatedStyleCustom } from './util/PullTuNextHelper';

// https://github.com/software-mansion/react-native-gesture-handler/issues/420#issuecomment-1356861934
// https://snack.expo.dev/@himanshu266/bottom-sheet-scrollview

type AnimatedScrollViewProps = RNScrollViewProps & NativeViewGestureHandlerProps & RefAttributes<RNScrollView>;
const AnimatedScrollView: React.FunctionComponent<AnimateProps<AnimatedScrollViewProps>> =
  Animated.createAnimatedComponent<AnimatedScrollViewProps>(RNGHScrollView);

function App() {
  const PAGE_ITEM_HEIGHT = Dimensions.get('window').height / 3;
  const originPreNestedScrollViewRef: RefObject<ScrollView> = useRef<ScrollView>(null);
  const originCurNestedScrollViewRef: RefObject<ScrollView> = useRef<ScrollView>(null);
  const originNextNestedScrollViewRef: RefObject<ScrollView> = useRef<ScrollView>(null);
  const pullTuNextHelperRef = usePullToNextHelperRef(
    new PullTuNextHelper([
      new PageItem(
        'A',
        PAGE_ITEM_HEIGHT,
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(false),
        useSharedValue(true),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(true),
        useSharedValue(false),
        originPreNestedScrollViewRef
      ),
      new PageItem(
        'B',
        PAGE_ITEM_HEIGHT,
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(false),
        useSharedValue(true),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(true),
        useSharedValue(false),
        originCurNestedScrollViewRef
      ),
      new PageItem(
        'C',
        PAGE_ITEM_HEIGHT,
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(false),
        useSharedValue(true),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(true),
        useSharedValue(false),
        originNextNestedScrollViewRef
      ),
    ])
  );

  const prePageItemOrigin = pullTuNextHelperRef.current.getPrePageItemOrigin();
  const curPageItemOrigin = pullTuNextHelperRef.current.getCurPageItemOrigin();
  const nextPageItemOrigin = pullTuNextHelperRef.current.getNextPageItemOrigin();
  const sheetAnimatedStyleForPrePageItemOrigin = useAnimatedStyleCustom(prePageItemOrigin);
  const sheetAnimatedStyleForCurPageItemOrigin = useAnimatedStyleCustom(curPageItemOrigin);
  const sheetAnimatedStyleForNextPageItemOrigin = useAnimatedStyleCustom(nextPageItemOrigin);

  const composedGesture = Gesture.Exclusive(
    prePageItemOrigin.panGesture as PanGesture,
    curPageItemOrigin.panGesture as PanGesture,
    nextPageItemOrigin.panGesture as PanGesture
  );

  const containerProps = useAnimatedProps<AnimateProps<ViewProps>>(() => ({
    // pointerEvents: curPageItemIsEnabledGesture.value ? 'auto' : 'none',
    pointerEvents: 'auto',
  }));

  const pageView = (pageItem: PageItem, sheetAnimatedStyle: any) => {
    const isOriginPre = pageItem.name === 'A';
    // const isOriginCurrent = pageItem.name === 'B';
    const isOriginNext = pageItem.name === 'C';
    return (
      <Animated.View
        style={[
          sheetAnimatedStyle,
          {
            overflow: 'hidden',
            height: PAGE_ITEM_HEIGHT,
            maxHeight: PAGE_ITEM_HEIGHT,
            minHeight: PAGE_ITEM_HEIGHT,
            width: '100%',
            backgroundColor: isOriginPre ? 'red' : isOriginNext ? 'blue' : 'green',
            zIndex: isOriginPre ? 3 : isOriginNext ? 3 : 2,
            top: isOriginPre ? 0 : isOriginNext ? PAGE_ITEM_HEIGHT + PAGE_ITEM_HEIGHT : PAGE_ITEM_HEIGHT,
            position: 'absolute',
          },
        ]}
      >
        <View
          style={[
            {
              overflow: 'hidden',
              height: PAGE_ITEM_HEIGHT,
              maxHeight: PAGE_ITEM_HEIGHT,
              minHeight: PAGE_ITEM_HEIGHT,
              width: '100%',
            },
          ]}
        >
          {Header}
          <View style={{ flex: 1, borderRadius: 5, overflow: 'hidden' }}>
            <AnimatedScrollView
              ref={pageItem.nestedScrollViewRef}
              scrollEventThrottle={1}
              onScroll={pageItem.scrollHandler}
              style={{ flex: 1 }}
              bounces={false}
              bouncesZoom={false}
              alwaysBounceVertical={false}
              alwaysBounceHorizontal={false}
              fadingEdgeLength={0}
              overScrollMode={'never'}
              animatedProps={pageItem.scrollViewProps}
              contentContainerStyle={{}}
            >
              {ScrollViewContent}
            </AnimatedScrollView>
          </View>
          {Footer}
        </View>
      </Animated.View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        overflow: 'hidden',
        height: PAGE_ITEM_HEIGHT * 3,
        maxHeight: PAGE_ITEM_HEIGHT * 3,
        minHeight: PAGE_ITEM_HEIGHT * 3,
        width: '100%',
        backgroundColor: 'pink',
        marginTop: StatusBar.currentHeight,
      }}
    >
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            height: PAGE_ITEM_HEIGHT * 3,
            maxHeight: PAGE_ITEM_HEIGHT * 3,
            minHeight: PAGE_ITEM_HEIGHT * 3,
            width: '100%',
            backgroundColor: 'cyan',
          }}
          animatedProps={containerProps}
        >
          {pageView(pullTuNextHelperRef.current.getPrePageItemOrigin(), sheetAnimatedStyleForPrePageItemOrigin)}
          {pageView(pullTuNextHelperRef.current.getCurPageItemOrigin(), sheetAnimatedStyleForCurPageItemOrigin)}
          {pageView(pullTuNextHelperRef.current.getNextPageItemOrigin(), sheetAnimatedStyleForNextPageItemOrigin)}
          <TouchableOpacity
            style={styles.restoreContainer}
            onPress={() => {
              pullTuNextHelperRef.current.reset();
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#ffffff' }}>RESTORE</Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default gestureHandlerRootHOC(App);

const styles = StyleSheet.create({
  restoreContainer: {
    zIndex: 10,
    position: 'absolute',
    right: 0,
    bottom: 80,
    margin: 16,
    backgroundColor: '#fec74b',
    borderRadius: 60,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
