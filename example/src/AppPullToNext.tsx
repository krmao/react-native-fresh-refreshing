import React, { RefAttributes, useRef } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
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

// https://github.com/software-mansion/react-native-gesture-handler/issues/420#issuecomment-1356861934
// https://snack.expo.dev/@himanshu266/bottom-sheet-scrollview

type AnimatedScrollViewProps = RNScrollViewProps & NativeViewGestureHandlerProps & RefAttributes<RNScrollView>;
const AnimatedScrollView: React.FunctionComponent<AnimateProps<AnimatedScrollViewProps>> =
  Animated.createAnimatedComponent<AnimatedScrollViewProps>(RNGHScrollView);

function App() {
  let { width, height } = useWindowDimensions();
  height = Dimensions.get('screen').height; // test

  const STATUS_CURRENT_PAGE = 0; // 默认状态
  const STATUS_CURRENT_PAGE_HEADER_LOADING = 100; // header 加载中
  const STATUS_NEXT_PAGE = height * 0.8; // 下一页

  const animatedScrollViewRef = useRef<RNGHScrollView>(null);
  const testCount = useRef<number>(0);

  const preStatus = useSharedValue(STATUS_CURRENT_PAGE);

  const isTouching = useSharedValue(false);
  // 当前 page 实时整体页面位移值
  // 手指触摸移动以及松开手指还原状态时通过改变这个值达到动画位移的效果
  const currentPageTranslationY = useSharedValue(STATUS_CURRENT_PAGE);
  // scrollView 手指触摸时内部内容滚动的实时位移值
  const currentPageNestedChildTouchingOffset = useSharedValue(0);
  // scrollView 的实时内部内容滚动值
  const currentPageNestedChildScrollY = useSharedValue(0);

  const isNestedChildCanPullUpToDown = useSharedValue(true);
  const isNestedChildCanPullDownToUp = useSharedValue(false);

  // scroll handler for scrollview
  const scrollHandler = useAnimatedScrollHandler(({ contentOffset, layoutMeasurement, contentSize }) => {
    currentPageNestedChildScrollY.value = Math.round(contentOffset.y);
    isNestedChildCanPullUpToDown.value = currentPageNestedChildScrollY.value === 0;
    isNestedChildCanPullDownToUp.value =
      Math.round(layoutMeasurement.height + contentOffset.y) >= Math.round(contentSize.height);
    if (isNestedChildCanPullUpToDown.value || isNestedChildCanPullDownToUp.value) {
      console.log(
        '-- isNestedChildCanPullUpToDown=',
        isNestedChildCanPullUpToDown.value,
        'isNestedChildCanPullDownToUp=',
        isNestedChildCanPullDownToUp.value,
        layoutMeasurement.height + contentOffset.y,
        contentSize.height
      );
    }
  });

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
    }, 1500);
  };

  const simulateScroll = () => {
    console.log('-- 模拟滚动');
    animatedScrollViewRef?.current?.scrollTo?.(-currentPageTranslationY.value + STATUS_CURRENT_PAGE, undefined, false);
  };

  // pan handler for sheet
  const gesture = Gesture.Pan()
    .onBegin(() => {
      // touching screen
      isTouching.value = true;
    })
    .onUpdate((e) => {
      // move sheet if top or scrollview or is closed state
      if (currentPageNestedChildScrollY.value === 0 || preStatus.value === STATUS_NEXT_PAGE) {
        // current page changing translationY
        currentPageTranslationY.value = preStatus.value + e.translationY - currentPageNestedChildTouchingOffset.value;
        console.log('-- 页面正在位移', e.translationY);
        // capture movement, but don't move sheet
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
        runOnJS(simulateScroll)();
      }
    })
    .onEnd((e) => {
      // default on worklet thread, https://github.com/software-mansion/react-native-gesture-handler/issues/2300

      // close sheet if velocity or travel is good
      // if ((e.velocityY > 500 || e.translationY > 100) && scrollY.value < 1) {
      if (e.translationY > STATUS_CURRENT_PAGE_HEADER_LOADING * 3 && currentPageNestedChildScrollY.value < 1) {
        currentPageTranslationY.value = withTiming(STATUS_NEXT_PAGE, { duration: 200 });
        preStatus.value = STATUS_NEXT_PAGE;

        // else open sheet on reverse
        // } else if (e.velocityY < -500 || e.translationY < -100) {
      } else if (e.translationY < -400) {
        currentPageTranslationY.value = withTiming(STATUS_CURRENT_PAGE, { duration: 200 });
        preStatus.value = STATUS_CURRENT_PAGE;

        // don't do anything
      } else if (e.translationY >= STATUS_CURRENT_PAGE_HEADER_LOADING) {
        currentPageTranslationY.value = withTiming(STATUS_CURRENT_PAGE_HEADER_LOADING, { duration: 200 });
        preStatus.value = STATUS_CURRENT_PAGE_HEADER_LOADING;
        // start header loading

        runOnJS(handleHeaderLoading)();
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

  const scrollViewProps = useAnimatedProps(() => ({
    // only scroll if sheet is open
    scrollEnabled: preStatus.value === STATUS_CURRENT_PAGE,
    // only bounce at bottom or not touching screen
    // bounces: scrollY.value > 0 || !isTouching.value,
  }));
  // styles for screem
  const styles = StyleSheet.create({
    screen: {
      flex: 1,
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: useAnimatedStyle(() => ({
      // don't open beyond the open limit
      transform: [
        {
          translateY: interpolate(
            currentPageTranslationY.value,
            [0, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, height],
            [STATUS_CURRENT_PAGE, STATUS_CURRENT_PAGE, STATUS_NEXT_PAGE, STATUS_NEXT_PAGE + 5],
            'clamp'
          ),
        },
      ],
      shadowOffset: { height: -2, width: 0 },
      shadowOpacity: 0.15,
    })),
    blur: {
      padding: 1,
      overflow: 'hidden',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      backgroundColor: 'rgba(100,100,255,.65)',
    },
    scrollViewContainer: {
      paddingBottom: height * 0.3,
    },
    bar: {
      width: 50,
      height: 5,
      marginTop: 5,
      borderRadius: 5,
      backgroundColor: '#bbb',
      marginLeft: width / 2 - 25,
    },
    header: {
      borderBottomColor: 'rgba(0,0,0,.15)',
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title: {
      padding: 15,
      fontSize: 21,
      fontWeight: '600',
    },
    button: {
      fontSize: 15,
      borderBottomColor: 'rgba(0,0,0,.15)',
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingVertical: 20,
      paddingHorizontal: 15,
    },
    image: {
      width: '100%',
      borderRadius: 10,
      height: width / 2,
      marginBottom: 15,
    },
  });

  return (
    <View style={styles.screen}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={styles.sheet}>
          <View style={styles.blur}>
            <View style={styles.bar} />
            <View style={styles.header}>
              <Text style={styles.title}>Header</Text>
            </View>

            <AnimatedScrollView
              ref={animatedScrollViewRef}
              scrollEventThrottle={1}
              onScroll={scrollHandler}
              bounces={false}
              bouncesZoom={false}
              alwaysBounceVertical={false}
              alwaysBounceHorizontal={false}
              fadingEdgeLength={0}
              overScrollMode={'never'}
              animatedProps={scrollViewProps}
              contentContainerStyle={styles.scrollViewContainer}
            >
              {[...Array(20).keys()].map((i) => (
                <Pressable
                  key={i}
                  style={styles.button}
                  onPress={() => {
                    console.log('--', i);
                  }}
                >
                  <Text>Scroll Content {i + 1}</Text>
                </Pressable>
              ))}
            </AnimatedScrollView>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default gestureHandlerRootHOC(App);
