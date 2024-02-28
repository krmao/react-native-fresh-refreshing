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
} from 'react-native';
import {
  GestureDetector,
  gestureHandlerRootHOC,
  PanGesture,
  ScrollView,
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';
import Animated, { AnimateProps, useSharedValue } from 'react-native-reanimated';
import { NativeViewGestureHandlerProps } from 'react-native-gesture-handler/src/handlers/NativeViewGestureHandler';
import { Footer, Header, ScrollViewContent } from './util/PullToNextComponents';
import usePullToNextHelperRef, { PageItem, PullToNextHelper, useAnimatedStyleCustom } from './util/PullToNextHelper';

// https://github.com/software-mansion/react-native-gesture-handler/issues/420#issuecomment-1356861934
// https://snack.expo.dev/@himanshu266/bottom-sheet-scrollview

type AnimatedScrollViewProps = RNScrollViewProps & NativeViewGestureHandlerProps & RefAttributes<RNScrollView>;
const AnimatedScrollView: React.FunctionComponent<AnimateProps<AnimatedScrollViewProps>> =
  Animated.createAnimatedComponent<AnimatedScrollViewProps>(RNGHScrollView);

const PageItemView = ({ pageItem, containerAnimatedStyle }: { pageItem: PageItem; containerAnimatedStyle: any }) => {
  return (
    <GestureDetector gesture={pageItem.panGesture as PanGesture}>
      <Animated.View
        style={[
          containerAnimatedStyle,
          {
            width: '100%',
            overflow: 'hidden',
            position: 'absolute',
            top: pageItem.top,
            zIndex: pageItem.zIndex,
            height: pageItem.height,
            maxHeight: pageItem.height,
            minHeight: pageItem.height,
            backgroundColor: pageItem.backgroundColor,
          },
        ]}
        animatedProps={pageItem.containerAnimatedProps}
      >
        <View
          style={[
            {
              width: '100%',
              overflow: 'hidden',
              height: pageItem.height,
              maxHeight: pageItem.height,
              minHeight: pageItem.height,
            },
          ]}
        >
          {Header({ name: pageItem.name, backgroundColor: pageItem.backgroundColor })}
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
              {ScrollViewContent({
                name: pageItem.name,
                backgroundColor: pageItem.backgroundColor,
                textBackgroundColor: pageItem.name === 'A' ? 'pink' : pageItem.name === 'B' ? '#aec33a' : 'skyblue',
              })}
            </AnimatedScrollView>
          </View>
          {Footer({ name: pageItem.name, backgroundColor: pageItem.backgroundColor })}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

function App() {
  // const defaultCurTopInPageContainer = 15; // 默认当前页面的 top 值从容器的什么地方开始, 决定了顶部是否漏出一点上一个页面
  // const PAGE_CONTAINER_HEIGHT = Dimensions.get('window').height; // 容器高度
  // const PAGE_ITEM_HEIGHT = PAGE_CONTAINER_HEIGHT - 15 - 15; // 每一页的高度

  const defaultCurTopInPageContainer = 0; // 默认当前页面的 top 值从容器的什么地方开始, 决定了顶部是否漏出一点上一个页面
  const PAGE_CONTAINER_HEIGHT = Dimensions.get('window').height; // 容器高度
  const PAGE_ITEM_HEIGHT = PAGE_CONTAINER_HEIGHT; // 每一页的高度

  const originANestedScrollViewRef: RefObject<ScrollView> = useRef<ScrollView>(null);
  const originBNestedScrollViewRef: RefObject<ScrollView> = useRef<ScrollView>(null);
  const originCNestedScrollViewRef: RefObject<ScrollView> = useRef<ScrollView>(null);

  const pullTuNextHelperRef = usePullToNextHelperRef(
    new PullToNextHelper([
      new PageItem(
        'A',
        false,
        PAGE_ITEM_HEIGHT,
        0,
        52,
        -52,
        -PAGE_ITEM_HEIGHT,
        PAGE_ITEM_HEIGHT,
        'red',
        useSharedValue(0),
        useSharedValue(PullToNextHelper.getDefaultTop('A', PAGE_ITEM_HEIGHT, defaultCurTopInPageContainer)),
        useSharedValue(2),
        useSharedValue(0),
        useSharedValue(false),
        useSharedValue(true),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(true),
        useSharedValue(false),
        originANestedScrollViewRef
      ),
      new PageItem(
        'B',
        true,
        PAGE_ITEM_HEIGHT,
        0,
        52,
        -52,
        -PAGE_ITEM_HEIGHT,
        PAGE_ITEM_HEIGHT,
        'green',
        useSharedValue(0),
        useSharedValue(PullToNextHelper.getDefaultTop('B', PAGE_ITEM_HEIGHT, defaultCurTopInPageContainer)),
        useSharedValue(1),
        useSharedValue(0),
        useSharedValue(false),
        useSharedValue(true),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(true),
        useSharedValue(false),
        originBNestedScrollViewRef
      ),
      new PageItem(
        'C',
        false,
        PAGE_ITEM_HEIGHT,
        0,
        52,
        -52,
        -PAGE_ITEM_HEIGHT,
        PAGE_ITEM_HEIGHT,
        'blue',
        useSharedValue(0),
        useSharedValue(PullToNextHelper.getDefaultTop('C', PAGE_ITEM_HEIGHT, defaultCurTopInPageContainer)),
        useSharedValue(2),
        useSharedValue(0),
        useSharedValue(false),
        useSharedValue(true),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(0),
        useSharedValue(true),
        useSharedValue(false),
        originCNestedScrollViewRef
      ),
    ])
  );

  const aItemOrigin = pullTuNextHelperRef.current.getAPageItem();
  const bPageItemOrigin = pullTuNextHelperRef.current.getBPageItem();
  const cPageItemOrigin = pullTuNextHelperRef.current.getCPageItem();

  const containerAnimatedStyleForAPageItemOrigin = useAnimatedStyleCustom(aItemOrigin);
  const containerAnimatedStyleForBPageItemOrigin = useAnimatedStyleCustom(bPageItemOrigin);
  const containerAnimatedStyleForCPageItemOrigin = useAnimatedStyleCustom(cPageItemOrigin);

  useEffect(() => {
    setTimeout(() => {
      pullTuNextHelperRef.current.goToPreOrNext();
    }, 1000);
  }, [pullTuNextHelperRef]);

  return (
    <View
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: PAGE_CONTAINER_HEIGHT,
        maxHeight: PAGE_CONTAINER_HEIGHT,
        minHeight: PAGE_CONTAINER_HEIGHT,
        backgroundColor: '#efefef',
        marginTop: StatusBar.currentHeight,
      }}
    >
      <PageItemView pageItem={aItemOrigin} containerAnimatedStyle={containerAnimatedStyleForAPageItemOrigin} />
      <PageItemView pageItem={bPageItemOrigin} containerAnimatedStyle={containerAnimatedStyleForBPageItemOrigin} />
      <PageItemView pageItem={cPageItemOrigin} containerAnimatedStyle={containerAnimatedStyleForCPageItemOrigin} />
      <TouchableOpacity
        style={styles.resetContainer}
        onPress={() => {
          pullTuNextHelperRef.current.reset((pageItem) => {
            pageItem.top.value = PullToNextHelper.getDefaultTop(
              pageItem.name,
              pageItem.height,
              defaultCurTopInPageContainer
            );
            return pageItem;
          });
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#ffffff' }}>RESTORE</Text>
      </TouchableOpacity>
    </View>
  );
}

export default gestureHandlerRootHOC(App);

const styles = StyleSheet.create({
  resetContainer: {
    zIndex: 999,
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
