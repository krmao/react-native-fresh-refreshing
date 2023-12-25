import React, { RefAttributes, useRef } from 'react';
import {
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
  const { width, height } = useWindowDimensions();
  const open = height * 0.1;
  const closed = height * 0.6;
  const animatedScrollViewRef = useRef<RNGHScrollView>(null);

  const moving = useSharedValue(false);
  const prevY = useSharedValue(closed);
  const transY = useSharedValue(closed);
  const movedY = useSharedValue(0);
  const scrollY = useSharedValue(0);

  // scroll handler for scrollview
  const scrollHandler = useAnimatedScrollHandler(({ contentOffset }) => {
    scrollY.value = Math.round(contentOffset.y);
  });

  // pan handler for sheet
  const gesture = Gesture.Pan()
    .onBegin(() => {
      // touching screen
      moving.value = true;
    })
    .onUpdate((e) => {
      // move sheet if top or scrollview or is closed state
      if (scrollY.value === 0 || prevY.value === closed) {
        transY.value = prevY.value + e.translationY - movedY.value;

        // capture movement, but don't move sheet
      } else {
        movedY.value = e.translationY;
      }

      // simulate scroll if user continues touching screen
      if (prevY.value !== open && transY.value < open) {
        const scrollTo = animatedScrollViewRef?.current?.scrollTo;
        if (scrollTo) {
          runOnJS(scrollTo)({ y: -transY.value + open, animated: false });
        }
      }
    })
    .onEnd((e) => {
      // close sheet if velocity or travel is good
      if ((e.velocityY > 500 || e.translationY > 100) && scrollY.value < 1) {
        transY.value = withTiming(closed, { duration: 200 });
        prevY.value = closed;

        // else open sheet on reverse
      } else if (e.velocityY < -500 || e.translationY < -100) {
        transY.value = withTiming(open, { duration: 200 });
        prevY.value = open;

        // don't do anything
      } else {
        transY.value = withTiming(prevY.value, { duration: 200 });
      }
    })
    .onFinalize((_e) => {
      // stopped touching screen
      moving.value = false;
      movedY.value = 0;
    })
    .simultaneousWithExternalGesture(animatedScrollViewRef);

  const scrollViewProps = useAnimatedProps(() => ({
    // only scroll if sheet is open
    scrollEnabled: prevY.value === open,
    // only bounce at bottom or not touching screen
    bounces: scrollY.value > 0 || !moving.value,
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
          translateY: interpolate(transY.value, [0, open, closed, height], [open, open, closed, closed + 20], 'clamp'),
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
