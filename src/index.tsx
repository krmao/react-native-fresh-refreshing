import React, { useEffect } from 'react';
import { NativeScrollEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import DefaultLoader from './loader';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { HitSlop } from 'react-native-gesture-handler/lib/typescript/handlers/gestureHandlerCommon';

interface Props {
  isLoading: boolean;
  onRefresh: () => void;
  refreshHeight?: number;
  defaultAnimationEnabled?: boolean;
  contentOffset?: Animated.SharedValue<number>;
  children: JSX.Element;
  Loader?: JSX.Element | (() => JSX.Element);
  bounces?: boolean;
  hitSlop?: HitSlop;
  managedLoading?: boolean;
}

const RefreshableWrapper: React.FC<Props> = ({
  isLoading,
  onRefresh,
  refreshHeight = 100,
  defaultAnimationEnabled,
  contentOffset,
  children,
  Loader = <DefaultLoader />,
  bounces = true,
  hitSlop,
  managedLoading = false,
}) => {
  //region 当组件卸载时会自动执行 cancelAnimation 取消与共享值配对的正在运行的动画, 防止内存泄露, 改变时在UI线程执行
  //https://github.com/software-mansion/react-native-reanimated/blob/a898b3efcb3163ee2579ca7c4076fa76d74aac93/src/reanimated2/hook/useSharedValue.ts#L14
  //https://github.com/software-mansion/react-native-reanimated/blob/a898b3efcb3163ee2579ca7c4076fa76d74aac93/src/reanimated2/mutables.ts

  // 正在刷新->固定位置到 refreshHeight / 完成刷新->回弹到 0
  const isRefreshing = useSharedValue(false);
  const loaderOffsetY = useSharedValue(0);
  const listContentOffsetY = useSharedValue(0);
  const isLoaderActive = useSharedValue(false);
  //endregion

  //region 当刷新状态改变, 即 开始刷新/完成刷新 时回调
  useEffect(() => {
    if (!isLoading) {
      loaderOffsetY.value = withTiming(0);
      isRefreshing.value = false;
      isLoaderActive.value = false;
    } else if (managedLoading) {
      // In managed mode, we want to start the animation
      // running when isLoading is set to true as well
      loaderOffsetY.value = withTiming(refreshHeight);
      isRefreshing.value = true;
      isLoaderActive.value = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);
  //endregion

  //region 返回一个可以被可滚动组件使用的事件处理程序的引用, 非主JS线程('worklet')执行回调, 提升性能
  //https://docs.swmansion.com/react-native-reanimated/docs/scroll/useAnimatedScrollHandler
  //https://github.com/software-mansion/react-native-reanimated/blob/a898b3efcb3163ee2579ca7c4076fa76d74aac93/src/reanimated2/hook/useAnimatedScrollHandler.ts#L46
  const onScroll = useAnimatedScrollHandler((event: NativeScrollEvent) => {
    listContentOffsetY.value = event.contentOffset.y;
    // recover children component onScroll event
    if (children.props.onScroll) {
      runOnJS(children.props.onScroll)(event);
    }
  });
  //endregion

  //region 共享 loaderOffsetY, 当 loaderOffsetY 值改变时触发回调 updater 函数
  //https://docs.swmansion.com/react-native-reanimated/docs/core/useDerivedValue
  useDerivedValue(() => {
    if (contentOffset) {
      contentOffset.value = loaderOffsetY.value;
    }
  }, [loaderOffsetY]);
  //endregion

  //region header 动画样式, 当共享值发生改变时, 动画组件 animated style 会自动更新形成动画
  //https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedStyle/
  const loaderAnimation = useAnimatedStyle(() => {
    return {
      height: refreshHeight,
      transform: defaultAnimationEnabled
        ? [
            {
              translateY: isLoaderActive.value
                ? interpolate(loaderOffsetY.value, [0, refreshHeight - 20], [-10, 10], Extrapolation.CLAMP)
                : withTiming(-10),
            },
            {
              scale: isLoaderActive.value ? withSpring(1) : withTiming(0.01),
            },
          ]
        : undefined,
    };
  });
  //endregion

  //region 下拉越界动画, 回弹动画
  const overscrollAnimation = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: isLoaderActive.value
            ? isRefreshing.value
              ? withTiming(refreshHeight)
              : interpolate(loaderOffsetY.value, [0, refreshHeight], [0, refreshHeight], Extrapolation.CLAMP)
            : withTiming(0),
        },
      ],
    };
  });
  //endregion

  //region 下拉手势与手势兼容

  //region 可滚动子组件的手势
  const native = Gesture.Native();
  //endregion

  //region 下拉手势
  const panGesture = Gesture.Pan()
    .onChange((event) => {
      'worklet';
      isLoaderActive.value = loaderOffsetY.value > 0;

      if (((listContentOffsetY.value <= 0 && event.velocityY >= 0) || isLoaderActive.value) && !isRefreshing.value) {
        loaderOffsetY.value = event.translationY;
      }
    })
    .onEnd(() => {
      'worklet';
      if (!isRefreshing.value) {
        if (loaderOffsetY.value >= refreshHeight && !isRefreshing.value) {
          isRefreshing.value = true;
          runOnJS(onRefresh)();
        } else {
          isLoaderActive.value = false;
          loaderOffsetY.value = withTiming(0);
        }
      }
    });
  //endregion

  //region 设置手势的触摸区域
  if (hitSlop !== undefined) {
    panGesture.hitSlop(hitSlop);
  }
  //endregion

  //endregion

  return (
    <View style={styles.container}>
      {/*刷新头部组件*/}
      <Animated.View style={[styles.headerContainer, loaderAnimation]}>
        {typeof Loader === 'function' ? <Loader /> : Loader}
      </Animated.View>

      {/*处理本组件自身的 overscroll 手势*/}
      <GestureDetector gesture={panGesture}>
        {/*携带 children 元素的容器, 容器本身支持 overscrollAnimation 动画*/}
        <Animated.View style={[styles.container, overscrollAnimation]}>
          {/*作为中间层兼容 children 自身的手势(比如 ScrollView 的自身滚动)和本组件自身的 overscroll 手势*/}
          <GestureDetector gesture={Gesture.Simultaneous(panGesture, native)}>
            {/*复制并生成新的 children 元素并额外支持 onScroll、bounces 两个属性*/}
            {children && React.cloneElement(children, { onScroll: onScroll, bounces: bounces })}
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
  },
});

export default RefreshableWrapper;
