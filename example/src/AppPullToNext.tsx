import React, { RefAttributes, useRef } from 'react';
import {
  Dimensions,
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
  StatusBar,
  StyleSheet,
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
  let windowHeight = Dimensions.get('window').height; // test

  const STATUS_CURRENT_PAGE = 0; // 默认状态
  const STATUS_CURRENT_PAGE_HEADER_LOADING = 100; // header 加载中
  const STATUS_CURRENT_PAGE_FOOTER_LOADING = -100; // footer 加载中
  const STATUS_PRE_PAGE = -windowHeight * 0.8; // 上一页
  const STATUS_NEXT_PAGE = windowHeight * 0.8; // 下一页

  const animatedScrollViewPreRef = useRef<RNGHScrollView>(null);
  const animatedScrollViewRef = useRef<RNGHScrollView>(null);
  const animatedScrollViewNextRef = useRef<RNGHScrollView>(null);
  const testCount = useRef<number>(0);

  const preStatus = useSharedValue(STATUS_CURRENT_PAGE);
  const isTouching = useSharedValue(false);
  // 当前 page 实时整体页面位移值
  // 手指触摸移动以及松开手指还原状态时通过改变这个值达到动画位移的效果
  const currentPageTranslationY = useSharedValue(STATUS_CURRENT_PAGE);
  // scrollView 手指触摸时内部内容滚动的实时位移值
  const lastY = useSharedValue(0);
  const currentPageNestedChildTouchingOffset = useSharedValue(0);
  // scrollView 的实时内部内容滚动值
  const currentPageNestedChildScrollY = useSharedValue(0);
  const isNestedChildCanPullUpToDown = useSharedValue(true);
  const isNestedChildCanPullDownToUp = useSharedValue(false);
  const enabledGesture = useSharedValue(true);

  // scroll handler for scrollview
  const scrollPreHandler = useAnimatedScrollHandler(() => {});

  // scroll handler for scrollview
  const scrollHandler = useAnimatedScrollHandler(({ contentOffset, layoutMeasurement, contentSize }) => {
    currentPageNestedChildScrollY.value = Math.round(contentOffset.y);
    isNestedChildCanPullUpToDown.value = currentPageNestedChildScrollY.value === 0;
    isNestedChildCanPullDownToUp.value =
      Math.round(layoutMeasurement.height + contentOffset.y) + 0.5 >= Math.round(contentSize.height);
    // if (isNestedChildCanPullUpToDown.value || isNestedChildCanPullDownToUp.value) {
    console.log(
      '-- isNestedChildCanPullUpToDown=',
      isNestedChildCanPullUpToDown.value,
      'isNestedChildCanPullDownToUp=',
      isNestedChildCanPullDownToUp.value,
      'currentScrollContent=',
      layoutMeasurement.height + contentOffset.y,
      'contentSize=',
      contentSize
    );
    // }
  });

  // scroll handler for scrollview
  const scrollNextHandler = useAnimatedScrollHandler(() => {});

  const finishHeaderLoading = (goToNextPage: boolean = false) => {
    if (goToNextPage) {
      if (currentPageTranslationY.value !== STATUS_NEXT_PAGE) {
        currentPageTranslationY.value = withTiming(STATUS_NEXT_PAGE, { duration: 200 });
      }
      if (preStatus.value !== STATUS_NEXT_PAGE) {
        preStatus.value = STATUS_NEXT_PAGE;
      }
    } else {
      if (currentPageTranslationY.value !== STATUS_CURRENT_PAGE) {
        currentPageTranslationY.value = withTiming(STATUS_CURRENT_PAGE, { duration: 200 });
      }
      if (preStatus.value !== STATUS_CURRENT_PAGE) {
        preStatus.value = STATUS_CURRENT_PAGE;
      }
    }
  };

  const handleHeaderLoading = () => {
    setTimeout(() => {
      finishHeaderLoading(false);
      testCount.current++;
      enabledGesture.value = true;
    }, 1500);
  };

  const simulateScroll = () => {
    console.log('-- 模拟滚动');
    animatedScrollViewRef?.current?.scrollTo?.(-currentPageTranslationY.value + STATUS_CURRENT_PAGE, undefined, false);
  };

  // pan handler for sheet
  // const panGesture: PanGesture = Gesture.Pan();
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      console.log('===============onBegin e', e);
      lastY.value = e.y;
      // touching screen
      isTouching.value = true;
    })
    .onUpdate((e) => {
      const isPullingUpToDown = e.y - lastY.value > 0;
      console.log('===============onUpdate isPullingUpToDown=', isPullingUpToDown);
      console.log('===============onUpdate e', e);
      // move sheet if top or scrollview or is closed state
      if (isPullingUpToDown && currentPageNestedChildScrollY.value === 0) {
        // current page changing translationY
        currentPageTranslationY.value = preStatus.value + e.translationY - currentPageNestedChildTouchingOffset.value;
        console.log(
          '-- 页面正在位移 下拉 translationY=',
          e.translationY,
          'currentPageTranslationY=',
          currentPageTranslationY.value,
          'currentPageNestedChildTouchingOffset=',
          currentPageNestedChildTouchingOffset.value
        );
        // capture movement, but don't move sheet
      } else if (!isPullingUpToDown && isNestedChildCanPullDownToUp.value) {
        currentPageTranslationY.value = preStatus.value + e.translationY - currentPageNestedChildTouchingOffset.value;
        // currentPageTranslationY.value = -currentPageTranslationY.value;
        // currentPageTranslationY.value = e.translationY;
        console.log(
          '-- 页面正在位移 上拉 translationY=',
          e.translationY,
          'currentPageTranslationY=',
          currentPageTranslationY.value,
          'currentPageNestedChildTouchingOffset=',
          currentPageNestedChildTouchingOffset.value,
          'preStatus=',
          preStatus.value
        );
      } else {
        // current page child scrollview nested scroll
        currentPageNestedChildTouchingOffset.value = e.translationY;
        console.log(
          '-- ScrollView 内部滚动',
          currentPageNestedChildTouchingOffset.value,
          currentPageNestedChildScrollY.value
        );
      }

      // simulate scroll if user continues touching screen
      if (preStatus.value !== STATUS_CURRENT_PAGE && currentPageTranslationY.value < STATUS_CURRENT_PAGE) {
        console.log(
          '-- ScrollView simulateScroll',
          currentPageNestedChildTouchingOffset.value,
          currentPageNestedChildScrollY.value
        );
        runOnJS(simulateScroll)();
      }
    })
    .onEnd((e) => {
      // default on worklet thread, https://github.com/software-mansion/react-native-gesture-handler/issues/2300

      // close sheet if velocity or travel is good
      if (e.translationY >= STATUS_CURRENT_PAGE_HEADER_LOADING && currentPageNestedChildScrollY.value < 1) {
        enabledGesture.value = false;
        currentPageTranslationY.value = withTiming(
          STATUS_CURRENT_PAGE_HEADER_LOADING,
          { duration: 200 },
          (finished) => {
            if (finished) {
              runOnJS(handleHeaderLoading)();
            }
          }
        );
        preStatus.value = STATUS_CURRENT_PAGE_HEADER_LOADING;
        // start header loading
      } else if (e.translationY <= STATUS_CURRENT_PAGE_FOOTER_LOADING && isNestedChildCanPullDownToUp.value) {
        console.log('=====onEnd====== isNestedChildCanPullDownToUp', isNestedChildCanPullDownToUp.value);
        enabledGesture.value = false;
        currentPageTranslationY.value = withTiming(
          STATUS_CURRENT_PAGE_FOOTER_LOADING,
          { duration: 200 },
          (finished) => {
            if (finished) {
              runOnJS(handleHeaderLoading)();
            }
          }
        );
        preStatus.value = STATUS_CURRENT_PAGE_HEADER_LOADING;
        // start header loading
      } else {
        currentPageTranslationY.value = withTiming(preStatus.value, { duration: 200 });
      }
    })
    .onFinalize((_e) => {
      // stopped touching screen
      isTouching.value = false;
      currentPageNestedChildTouchingOffset.value = 0;
    })
    .simultaneousWithExternalGesture(animatedScrollViewRef)
    .runOnJS(false);

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

  const styles = StyleSheet.create({
    sheetAnimatedStyle: useAnimatedStyle(() => {
      const isPullingUpToDown = currentPageTranslationY.value >= 0;
      const isPullingDownToUp = currentPageTranslationY.value < 0;
      console.log(
        '-- sheetAnimatedStyle isPullingUpToDown=',
        isPullingUpToDown,
        'isPullingDownToUp=',
        isPullingDownToUp
      );
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
            translateY: currentPageTranslationY.value,
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
          currentPageTranslationY.value,
          [0, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, windowHeight],
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

  const containerProps = useAnimatedProps<AnimateProps<ViewProps>>(() => ({
    pointerEvents: enabledGesture.value ? 'auto' : 'none',
  }));
  return (
    <View style={{ flex: 1 }}>
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
          <Animated.View style={styles.sheetAnimatedStyle}>
            <View
              style={[
                {
                  overflow: 'hidden',
                  backgroundColor: 'red',
                  // position: 'relative',
                  height: windowHeight - 5,
                  maxHeight: windowHeight - 5,
                  minHeight: windowHeight - 5,
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
                  ref={animatedScrollViewRef}
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
