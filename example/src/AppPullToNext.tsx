// noinspection JSUnusedLocalSymbols

import React, { RefAttributes, RefObject, useEffect, useRef } from 'react';
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
  const PAGE_ITEM_HEIGHT = Dimensions.get('window').height;
  const originPreNestedScrollViewRef: RefObject<ScrollView> = useRef<ScrollView>(null);
  const originCurNestedScrollViewRef: RefObject<ScrollView> = useRef<ScrollView>(null);
  const originNextNestedScrollViewRef: RefObject<ScrollView> = useRef<ScrollView>(null);
  //region refs
  const pullTuNextHelperRef = usePullToNextHelperRef(
    new PullTuNextHelper([
      new PageItem(
        'A',
        PAGE_ITEM_HEIGHT,
        useSharedValue(-PAGE_ITEM_HEIGHT),
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
        useSharedValue(PAGE_ITEM_HEIGHT),
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

  // 当前 page 实时整体页面位移值, 手指触摸移动以及松开手指还原状态时通过改变这个值达到动画位移的效果
  const curPageItemIsEnabledGesture = pullTuNextHelperRef.current.getCurPageItemIsEnabledGesture();

  useEffect(() => {
    let pullTuNextHelper = pullTuNextHelperRef.current;
    console.log('---- cur=', pullTuNextHelper.getCurPageItem().toString());
    for (let i = 0; i < 5; i++) {
      pullTuNextHelperRef.current.moveToNextItem();
      console.log('---- cur=', pullTuNextHelper.getCurPageItem().toString());
    }
    for (let i = 0; i < 5; i++) {
      pullTuNextHelperRef.current.moveToPreItem();
      console.log('---- cur=', pullTuNextHelper.getCurPageItem().toString());
    }
  }, [pullTuNextHelperRef]);
  //endregion

  const restoreStatus = () => {};
  //endregion

  const containerProps = useAnimatedProps<AnimateProps<ViewProps>>(() => ({
    pointerEvents: curPageItemIsEnabledGesture.value ? 'auto' : 'none',
  }));
  // const sheetAnimatedStylePre = useAnimatedStyleCustom(pullTuNextHelperRef.current.getPrePageItemOrigin());
  const sheetAnimatedStyle = useAnimatedStyleCustom(pullTuNextHelperRef.current.getCurPageItemOrigin());
  // const sheetAnimatedStyleNext = useAnimatedStyleCustom(pullTuNextHelperRef.current.getNextPageItemOrigin());
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <TouchableOpacity style={styles.restoreContainer} onPress={restoreStatus}>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#ffffff' }}>RESTORE</Text>
      </TouchableOpacity>
      <GestureDetector gesture={pullTuNextHelperRef.current.getCurPageItemOrigin().panGesture as PanGesture}>
        <Animated.View style={{ flex: 1 }} animatedProps={containerProps}>
          <Animated.View style={sheetAnimatedStyle}>
            <View
              style={[
                {
                  overflow: 'hidden',
                  height: PAGE_ITEM_HEIGHT - 5,
                  maxHeight: PAGE_ITEM_HEIGHT - 5,
                  minHeight: PAGE_ITEM_HEIGHT - 5,
                  marginTop: StatusBar.currentHeight,
                  marginHorizontal: 5,
                  marginBottom: 5,
                },
              ]}
            >
              {Header}
              <View style={{ flex: 1, borderRadius: 5, overflow: 'hidden' }}>
                <AnimatedScrollView
                  ref={pullTuNextHelperRef.current.getCurPageItemOriginNestedScrollViewRef()}
                  scrollEventThrottle={1}
                  onScroll={pullTuNextHelperRef.current.getCurPageItemOrigin().scrollHandler}
                  style={{ flex: 1 }}
                  bounces={false}
                  bouncesZoom={false}
                  alwaysBounceVertical={false}
                  alwaysBounceHorizontal={false}
                  fadingEdgeLength={0}
                  overScrollMode={'never'}
                  animatedProps={pullTuNextHelperRef.current.getCurPageItemOrigin().scrollViewProps}
                  contentContainerStyle={{}}
                >
                  {ScrollViewContent}
                </AnimatedScrollView>
              </View>
              {Footer}
            </View>
          </Animated.View>
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
