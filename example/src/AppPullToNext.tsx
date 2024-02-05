/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import React, { RefAttributes, useRef } from 'react';
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
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  AnimateProps,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { NativeViewGestureHandlerProps } from 'react-native-gesture-handler/src/handlers/NativeViewGestureHandler';
import { Footer, Header, ScrollViewContent } from './util/Test';

// https://github.com/software-mansion/react-native-gesture-handler/issues/420#issuecomment-1356861934
// https://snack.expo.dev/@himanshu266/bottom-sheet-scrollview

type AnimatedScrollViewProps = RNScrollViewProps & NativeViewGestureHandlerProps & RefAttributes<RNScrollView>;
const AnimatedScrollView: React.FunctionComponent<AnimateProps<AnimatedScrollViewProps>> =
  Animated.createAnimatedComponent<AnimatedScrollViewProps>(RNGHScrollView);

function App() {
  //region refs
  const nestedPreRef = useRef<RNGHScrollView>(null);
  const nestedRef = useRef<RNGHScrollView>(null);
  const nestedNextRef = useRef<RNGHScrollView>(null);
  //endregion

  //region const values
  const enableDebug = true;
  const enablePullToNext = true;
  const tag = enablePullToNext ? '[PullToNext]' : '[PullToRefresh]';
  const pageHeight = Dimensions.get('window').height;

  const STATUS_CURRENT_PAGE = 0; // 默认状态
  const STATUS_CURRENT_PAGE_HEADER_LOADING = 100; // header 加载中
  const STATUS_CURRENT_PAGE_FOOTER_LOADING = -100; // footer 加载中
  const STATUS_PRE_PAGE = -pageHeight + 100; // 上一页
  const STATUS_NEXT_PAGE = pageHeight - 100; // 下一页
  //endregion

  //region dynamic values
  const enabledGesture = useSharedValue(true);
  const preStatus = useSharedValue(STATUS_CURRENT_PAGE);
  const isTouching = useSharedValue(false);
  // 当前 page 实时整体页面位移值, 手指触摸移动以及松开手指还原状态时通过改变这个值达到动画位移的效果
  const curTranslationY = useSharedValue(STATUS_CURRENT_PAGE);
  // scrollView 手指触摸时内部内容滚动的实时位移值
  const lastY = useSharedValue(0);
  const curNestedTouchingOffset = useSharedValue(0);
  // scrollView 的实时内部内容滚动值
  const curNestedScrollY = useSharedValue(0);
  const isCurNestedCanPullingUpToDown = useSharedValue(true);
  const isCurNestedCanPullingDownToUp = useSharedValue(false);
  //endregion

  //region scroll handles
  const scrollPreHandler = useAnimatedScrollHandler(() => {});
  const scrollHandler = useAnimatedScrollHandler(({ contentOffset, layoutMeasurement, contentSize }) => {
    curNestedScrollY.value = Math.round(contentOffset.y);
    const curScrollHeight = layoutMeasurement.height + contentOffset.y;
    isCurNestedCanPullingUpToDown.value = curNestedScrollY.value === 0;
    isCurNestedCanPullingDownToUp.value = Math.round(curScrollHeight) + 0.5 >= Math.round(contentSize.height);
    // if (isNestedChildCanPullUpToDown.value || isNestedChildCanPullDownToUp.value) {
    if (enableDebug) {
      console.log(
        tag,
        'scrollHandler',
        'isCurNestedCanPullingUpToDown=',
        isCurNestedCanPullingUpToDown.value,
        'isCurNestedCanPullingDownToUp=',
        isCurNestedCanPullingDownToUp.value
      );
      console.log(tag, 'scrollHandler', '---- curScrollHeight=', curScrollHeight, 'contentSize=', contentSize);
    }
    // }
  });
  const scrollNextHandler = useAnimatedScrollHandler(() => {});
  //endregion

  //region loading
  const finishLoading = (isHeader: boolean, goToNextPage: boolean = enablePullToNext) => {
    if (goToNextPage) {
      if (isHeader) {
        if (curTranslationY.value !== STATUS_NEXT_PAGE) {
          curTranslationY.value = withTiming(STATUS_NEXT_PAGE, { duration: 200 });
        }
        if (preStatus.value !== STATUS_NEXT_PAGE) {
          preStatus.value = STATUS_NEXT_PAGE;
        }
      } else {
        if (curTranslationY.value !== STATUS_PRE_PAGE) {
          curTranslationY.value = withTiming(STATUS_PRE_PAGE, { duration: 200 });
        }
        if (preStatus.value !== STATUS_PRE_PAGE) {
          preStatus.value = STATUS_PRE_PAGE;
        }
      }
    } else {
      if (curTranslationY.value !== STATUS_CURRENT_PAGE) {
        curTranslationY.value = withTiming(STATUS_CURRENT_PAGE, { duration: 200 });
      }
      if (preStatus.value !== STATUS_CURRENT_PAGE) {
        preStatus.value = STATUS_CURRENT_PAGE;
      }
    }
  };

  const handleLoading = (isHeader: boolean) => {
    setTimeout(() => {
      finishLoading(isHeader);
      enabledGesture.value = true;
    }, 1500);
  };
  //endregion

  //region others
  const simulateScroll = () => {
    if (enableDebug) {
      console.log(tag, 'simulateScroll now...');
    }
    nestedRef?.current?.scrollTo?.(-curTranslationY.value + STATUS_CURRENT_PAGE, undefined, false);
  };
  const restoreState = () => {
    enabledGesture.value = true;
    preStatus.value = STATUS_CURRENT_PAGE;
    isTouching.value = false;
    curTranslationY.value = STATUS_CURRENT_PAGE;
    lastY.value = 0;
    curNestedTouchingOffset.value = 0;
    // curNestedScrollY.value = 0;
    // isCurNestedCanPullingUpToDown.value = false;
    // isCurNestedCanPullingDownToUp.value = false;
  };
  //endregion

  //region gesture
  // pan handler for sheet
  // const panGesture: PanGesture = Gesture.Pan();
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      lastY.value = e.y;
      isTouching.value = true;
      if (enableDebug) {
        console.log(tag, 'onBegin', e.y);
      }
    })
    .onUpdate((e) => {
      const isPullingUpToDown = e.y - lastY.value > 0;
      if (enableDebug) {
        console.log(tag, 'onUpdate y=', e.y, 'isPullingUpToDown=', isPullingUpToDown);
      }
      // move sheet if top or scrollview or is closed state
      if (isPullingUpToDown && curNestedScrollY.value === 0) {
        // current page changing translationY
        curTranslationY.value = preStatus.value + e.translationY - curNestedTouchingOffset.value;
        if (enableDebug) {
          console.log(
            tag,
            '页面下拉 translationY=',
            e.translationY,
            'curTranslationY=',
            curTranslationY.value,
            'curNestedTouchingOffset=',
            curNestedTouchingOffset.value
          );
        }
        // capture movement, but don't move sheet
      } else if (!isPullingUpToDown && isCurNestedCanPullingDownToUp.value) {
        curTranslationY.value = preStatus.value + e.translationY - curNestedTouchingOffset.value;
        // currentPageTranslationY.value = -currentPageTranslationY.value;
        // currentPageTranslationY.value = e.translationY;
        if (enableDebug) {
          console.log(
            tag,
            '页面上拉 translationY=',
            e.translationY,
            'curTranslationY=',
            curTranslationY.value,
            'curNestedTouchingOffset=',
            curNestedTouchingOffset.value,
            'preStatus=',
            preStatus.value
          );
        }
      } else {
        // current page child scrollview nested scroll
        curNestedTouchingOffset.value = e.translationY;
        if (enableDebug) {
          console.log(tag, '内部滚动', curNestedTouchingOffset.value, curNestedScrollY.value);
        }
      }

      // simulate scroll if user continues touching screen
      if (preStatus.value !== STATUS_CURRENT_PAGE && curTranslationY.value < STATUS_CURRENT_PAGE) {
        runOnJS(simulateScroll)();
      }
    })
    .onEnd((e) => {
      // default on worklet thread, https://github.com/software-mansion/react-native-gesture-handler/issues/2300

      // close sheet if velocity or travel is good
      if (e.translationY >= STATUS_CURRENT_PAGE_HEADER_LOADING && curNestedScrollY.value < 1) {
        enabledGesture.value = false;
        curTranslationY.value = withTiming(STATUS_CURRENT_PAGE_HEADER_LOADING, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(handleLoading)(true);
          }
        });
        preStatus.value = STATUS_CURRENT_PAGE_HEADER_LOADING;
        // start header loading
      } else if (e.translationY <= STATUS_CURRENT_PAGE_FOOTER_LOADING && isCurNestedCanPullingDownToUp.value) {
        if (enableDebug) {
          console.log(tag, 'onEnd isCurNestedCanPullingDownToUp=', isCurNestedCanPullingDownToUp.value);
        }
        enabledGesture.value = false;
        curTranslationY.value = withTiming(STATUS_CURRENT_PAGE_FOOTER_LOADING, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(handleLoading)(false);
          }
        });
        preStatus.value = STATUS_CURRENT_PAGE_HEADER_LOADING;
        // start header loading
      } else {
        curTranslationY.value = withTiming(preStatus.value, { duration: 200 });
      }
    })
    .onFinalize((_e) => {
      // stopped touching screen
      isTouching.value = false;
      curNestedTouchingOffset.value = 0;
    })
    .simultaneousWithExternalGesture(nestedRef)
    .runOnJS(false);
  //endregion

  //region props and styles
  const scrollViewPreProps = useAnimatedProps(() => ({
    // only scroll if sheet is open
    // scrollEnabled: preStatus.value === STATUS_CURRENT_PAGE,
    // only bounce at bottom or not touching screen
    // bounces: scrollY.value > 0 || !isTouching.value,
  }));

  const scrollViewProps = useAnimatedProps(() => ({
    // only scroll if sheet is open
    scrollEnabled: preStatus.value === STATUS_CURRENT_PAGE,
    // only bounce at bottom or not touching screen
    // bounces: scrollY.value > 0 || !isTouching.value,
  }));

  const scrollViewNextProps = useAnimatedProps(() => ({
    // only scroll if sheet is open
    // scrollEnabled: preStatus.value === STATUS_CURRENT_PAGE,
    // only bounce at bottom or not touching screen
    // bounces: scrollY.value > 0 || !isTouching.value,
  }));

  const sheetAnimatedPreStyle = useAnimatedStyle(() => ({
    // don't open beyond the open limit
    // transform: [
    //   {
    //     translateY: interpolate(
    //       currentPageTranslationY.value,
    //       [0, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, height],
    //       [STATUS_CURRENT_PAGE, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, STATUS_NEXT_PAGE + 5],
    //       'clamp'
    //     ),
    //   },
    // ],
  }));

  const animatedStyles = StyleSheet.create({
    sheetAnimatedStyle: useAnimatedStyle(() => {
      const isPullingUpToDown = curTranslationY.value >= 0;
      const isPullingDownToUp = curTranslationY.value < 0;
      if (enableDebug) {
        console.log(
          tag,
          'sheetAnimatedStyle isPullingUpToDown=',
          isPullingUpToDown,
          'isPullingDownToUp=',
          isPullingDownToUp
        );
      }
      return {
        // don't open beyond the open limit
        transform: [
          {
            // translateY: interpolate(
            //   currentPageTranslationY.value,
            //   [0, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, windowHeight],
            //   [STATUS_CURRENT_PAGE, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, STATUS_NEXT_PAGE + 5],
            //   'clamp'
            // ),
            translateY: curTranslationY.value,
          },
        ],
      };
    }),
  });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    // don't open beyond the open limit
    transform: [
      {
        translateY: interpolate(
          curTranslationY.value,
          [0, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, pageHeight],
          [STATUS_CURRENT_PAGE, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, STATUS_NEXT_PAGE + 5],
          'clamp'
        ),
      },
    ],
  }));

  const sheetAnimatedNextStyle = useAnimatedStyle(() => ({
    // don't open beyond the open limit
    // transform: [
    //   {
    //     translateY: interpolate(
    //       currentPageTranslationY.value,
    //       [0, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, height],
    //       [STATUS_CURRENT_PAGE, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, STATUS_NEXT_PAGE + 5],
    //       'clamp'
    //     ),
    //   },
    // ],
  }));
  //endregion

  const containerProps = useAnimatedProps<AnimateProps<ViewProps>>(() => ({
    pointerEvents: enabledGesture.value ? 'auto' : 'none',
  }));
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <TouchableOpacity style={styles.restore} onPress={restoreState}>
        <Text style={{ fontSize: 8, fontWeight: 'bold', color: 'white' }}>RESTORE</Text>
      </TouchableOpacity>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={{ flex: 1 }} animatedProps={containerProps}>
          {/*<Animated.View style={sheetAnimatedPreStyle}>
            <View
              style={[
                {
                  padding: 1,
                  overflow: 'hidden',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  backgroundColor: '#ffffef',
                  position: 'relative',
                  height: height,
                },
                {
                  position: 'absolute',
                  top: -height,
                  left: 0,
                  right: 0,
                  minHeight: height,
                  height: height,
                  maxHeight: height,
                },
              ]}
            >
              <View
                style={{
                  borderBottomColor: 'rgba(0,0,0,.15)',
                  borderBottomWidth: StyleSheet.hairlineWidth,
                }}
              >
                <Text
                  style={{
                    padding: 15,
                    fontSize: 21,
                    fontWeight: '600',
                  }}
                >
                  Header
                </Text>
              </View>
              <AnimatedScrollView
                ref={animatedScrollViewPreRef}
                scrollEventThrottle={1}
                onScroll={scrollPreHandler}
                bounces={false}
                bouncesZoom={false}
                alwaysBounceVertical={false}
                alwaysBounceHorizontal={false}
                fadingEdgeLength={0}
                overScrollMode={'never'}
                animatedProps={scrollViewPreProps}
                contentContainerStyle={{
                  paddingBottom: height * 0.3,
                  minHeight: height,
                }}
              >
                 {ScrollViewContent}
              </AnimatedScrollView>
            </View>
          </Animated.View>*/}
          <Animated.View style={animatedStyles.sheetAnimatedStyle}>
            <View
              style={[
                {
                  overflow: 'hidden',
                  backgroundColor: 'red',
                  // position: 'relative',
                  height: pageHeight - 5,
                  maxHeight: pageHeight - 5,
                  minHeight: pageHeight - 5,
                  marginTop: StatusBar.currentHeight,
                  marginHorizontal: 5,
                  marginBottom: 5,
                },
                {
                  // position: 'absolute',
                  // top: 0,
                  // left: 0,
                  // right: 0,
                  // minHeight: height,
                  // height: height,
                  // maxHeight: height,
                },
              ]}
            >
              {Header}
              <View style={{ flex: 1, backgroundColor: 'cyan' }}>
                <AnimatedScrollView
                  ref={nestedRef}
                  scrollEventThrottle={1}
                  onScroll={scrollHandler}
                  style={{ flex: 1, backgroundColor: 'blue' }}
                  bounces={false}
                  bouncesZoom={false}
                  alwaysBounceVertical={false}
                  alwaysBounceHorizontal={false}
                  fadingEdgeLength={0}
                  overScrollMode={'never'}
                  animatedProps={scrollViewProps}
                  contentContainerStyle={{
                    backgroundColor: 'yellow',
                  }}
                >
                  {ScrollViewContent}
                </AnimatedScrollView>
              </View>
              {Footer}
            </View>
          </Animated.View>
          {/*<Animated.View style={sheetAnimatedNextStyle}>
            <View
              style={[
                {
                  padding: 1,
                  overflow: 'hidden',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  backgroundColor: '#ffffef',
                  position: 'relative',
                  height: height,
                },
                {
                  position: 'absolute',
                  top: height,
                  left: 0,
                  right: 0,
                  minHeight: height,
                  height: height,
                  maxHeight: height,
                },
              ]}
            >
              <View
                style={{
                  borderBottomColor: 'rgba(0,0,0,.15)',
                  borderBottomWidth: StyleSheet.hairlineWidth,
                }}
              >
                <Text
                  style={{
                    padding: 15,
                    fontSize: 21,
                    fontWeight: '600',
                  }}
                >
                  Header
                </Text>
              </View>
              <AnimatedScrollView
                ref={animatedScrollViewNextRef}
                scrollEventThrottle={1}
                onScroll={scrollNextHandler}
                bounces={false}
                bouncesZoom={false}
                alwaysBounceVertical={false}
                alwaysBounceHorizontal={false}
                fadingEdgeLength={0}
                overScrollMode={'never'}
                animatedProps={scrollViewNextProps}
                contentContainerStyle={{
                  paddingBottom: height * 0.3,
                  minHeight: height,
                }}
              >
                 {ScrollViewContent}
              </AnimatedScrollView>
            </View>
          </Animated.View>*/}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default gestureHandlerRootHOC(App);

const styles = StyleSheet.create({
  restore: {
    zIndex: 10,
    position: 'absolute',
    right: 0,
    bottom: 0,
    margin: 16,
    backgroundColor: 'red',
    borderRadius: 48,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
