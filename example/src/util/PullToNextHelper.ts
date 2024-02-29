import React, { RefObject, useRef } from 'react';
import { Gesture, PanGesture, ScrollView } from 'react-native-gesture-handler';
import {
  AnimatableValue,
  AnimateProps,
  runOnJS,
  SharedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { NativeScrollEvent, NativeSyntheticEvent, ViewProps } from 'react-native';

export class PageItem {
  public readonly name: 'A' | 'B' | 'C';
  public readonly height: number;
  public readonly backgroundColor: string;
  public readonly preStatus: SharedValue<number>;
  public readonly top: SharedValue<number>;
  public readonly zIndex: SharedValue<number>;
  public readonly translationY: SharedValue<number>;
  public readonly isTouching: SharedValue<boolean>;
  public readonly isEnabledGesture: SharedValue<boolean>;
  public readonly lastY: SharedValue<number>;
  public readonly touchingOffset: SharedValue<number>;
  public readonly scrollY: SharedValue<number>;
  public readonly isCanPullingUpToDown: SharedValue<boolean>;
  public readonly isCanPullingDownToUp: SharedValue<boolean>;
  private _scrollHandler: ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | undefined = undefined;
  private _panGesture: PanGesture | null = null;
  private _scrollViewProps: Partial<any> | undefined = undefined;
  private _containerAnimatedProps: Partial<AnimateProps<ViewProps>> | undefined = undefined;
  public readonly nestedScrollViewRef: RefObject<ScrollView>;
  public readonly statusDefaultTranslationY: number = 0; // 默认状态
  public readonly statusHeaderTranslationY: number = 52; // HEADER 加载中
  public readonly statusFooterTranslationY: number = -52; // FOOTER 加载中
  public readonly statusPreTranslationY: number = 0; // 上一页
  public readonly statusNextTranslationY: number = 0; // 下一页
  public readonly animatedDurationForGoToDefault: number = 300;
  public readonly animatedDurationForGoToLoading: number = 300;
  public readonly animatedDurationForGoToPreOrNext: number = 500;
  public isShowingCenterNow: boolean;
  public containerAnimatedStyle: any;

  public constructor(
    name: 'A' | 'B' | 'C',
    isShowingCenterNow: boolean,
    height: number,
    statusDefaultTranslationY: number,
    statusHeaderTranslationY: number,
    statusFooterTranslationY: number,
    statusPreTranslationY: number,
    statusNextTranslationY: number,
    backgroundColor: string,
    preStatus: SharedValue<number>,
    top: SharedValue<number>,
    zIndex: SharedValue<number>,
    translationY: SharedValue<number>,
    isTouching: SharedValue<boolean>,
    isEnabledGesture: SharedValue<boolean>,
    lastY: SharedValue<number>,
    touchingOffset: SharedValue<number>,
    scrollY: SharedValue<number>,
    isCanPullingUpToDown: SharedValue<boolean>,
    isCanPullingDownToUp: SharedValue<boolean>,
    nestedScrollViewRef: RefObject<ScrollView>
  ) {
    this.name = name;
    this.isShowingCenterNow = isShowingCenterNow;
    this.height = height;
    this.backgroundColor = backgroundColor;
    this.preStatus = preStatus;
    this.top = top;
    this.zIndex = zIndex;
    this.translationY = translationY;
    this.isTouching = isTouching;
    this.isEnabledGesture = isEnabledGesture;
    this.lastY = lastY;
    this.touchingOffset = touchingOffset;
    this.scrollY = scrollY;
    this.isCanPullingUpToDown = isCanPullingUpToDown;
    this.isCanPullingDownToUp = isCanPullingDownToUp;
    this.nestedScrollViewRef = nestedScrollViewRef;
    this.statusDefaultTranslationY = statusDefaultTranslationY;
    this.statusHeaderTranslationY = statusHeaderTranslationY;
    this.statusFooterTranslationY = statusFooterTranslationY;
    this.statusPreTranslationY = statusPreTranslationY;
    this.statusNextTranslationY = statusNextTranslationY;
  }

  get scrollHandler(): ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | undefined {
    return this._scrollHandler;
  }

  get panGesture(): PanGesture | null {
    return this._panGesture;
  }

  get scrollViewProps(): Partial<any> | undefined {
    return this._scrollViewProps;
  }
  get containerAnimatedProps(): Partial<AnimateProps<ViewProps>> | undefined {
    return this._containerAnimatedProps;
  }

  set scrollHandler(scrollHandler: (event: NativeSyntheticEvent<NativeScrollEvent>) => void) {
    this._scrollHandler = scrollHandler;
  }

  set panGesture(panGesture: PanGesture) {
    this._panGesture = panGesture;
  }

  set scrollViewProps(scrollViewProps: Partial<any>) {
    this._scrollViewProps = scrollViewProps;
  }
  set containerAnimatedProps(containerProps: Partial<AnimateProps<ViewProps>>) {
    this._containerAnimatedProps = containerProps;
  }

  public toString(): string {
    return (
      `(name:${this.name}, ` +
      `height:${this.height}, ` +
      `translationY:${this.translationY.value}, ` +
      `isTouching:${this.isTouching.value}, ` +
      `isEnabledGesture:${this.isEnabledGesture.value}, ` +
      `nestedScrollViewRef:${this.nestedScrollViewRef.current})`
    );
  }
}

// noinspection JSUnusedGlobalSymbols
export class PullToNextHelper {
  public readonly pageItemOriginArray: Array<PageItem>;

  constructor(pageItemOriginArray: Array<PageItem>) {
    this.pageItemOriginArray = pageItemOriginArray.map((item) => {
      return { ...item };
    }) as Array<PageItem>;
  }

  //region 最初原始的
  public getAPageItem = (): PageItem => this.pageItemOriginArray[0] as PageItem;
  public getBPageItem = (): PageItem => this.pageItemOriginArray[1] as PageItem;
  public getCPageItem = (): PageItem => this.pageItemOriginArray[2] as PageItem;
  //endregion

  public getShowingCenterNowPageItem = (): PageItem => {
    return this.pageItemOriginArray.find((pageItem) => pageItem.isShowingCenterNow) as PageItem;
  };

  public goToPreOrNext = (goToNext = true, currentShowingCenterNowPageItem = this.getShowingCenterNowPageItem()) => {
    const pageItem = currentShowingCenterNowPageItem;
    const { prePageItem, nextPageItem } = this.getPreAndNextPageItems(pageItem);

    /**
     * 通过 runOnJS + setTimeout 解决直接调用导致的闪动问题
     */
    const updateStatusAfterGoToNext = (duration: number) => {
      setTimeout(() => {
        const curPageItemTopValue = pageItem.top.value;
        pageItem.top.value = nextPageItem.top.value;
        pageItem.translationY.value = pageItem.statusDefaultTranslationY;
        pageItem.preStatus.value = pageItem.statusDefaultTranslationY;
        pageItem.zIndex.value = 2;
        pageItem.isShowingCenterNow = false;
        pageItem.lastY.value = 0;

        nextPageItem.top.value = prePageItem.top.value;
        nextPageItem.translationY.value = nextPageItem.statusDefaultTranslationY;
        nextPageItem.preStatus.value = nextPageItem.statusDefaultTranslationY;
        nextPageItem.zIndex.value = 2;
        nextPageItem.isShowingCenterNow = false;
        nextPageItem.lastY.value = 0;

        prePageItem.top.value = curPageItemTopValue;
        prePageItem.translationY.value = prePageItem.statusDefaultTranslationY;
        prePageItem.preStatus.value = prePageItem.statusDefaultTranslationY;
        prePageItem.zIndex.value = 1;
        prePageItem.isShowingCenterNow = true;
        prePageItem.lastY.value = 0;
      }, duration);
    };

    /**
     * 通过 runOnJS + setTimeout 解决直接调用导致的闪动问题
     */
    const updateStatusAfterGoToPre = (duration: number) => {
      setTimeout(() => {
        const curPageItemTopValue = pageItem.top.value;
        pageItem.top.value = prePageItem.top.value;
        pageItem.translationY.value = pageItem.statusDefaultTranslationY;
        pageItem.preStatus.value = pageItem.statusDefaultTranslationY;
        pageItem.zIndex.value = 2;
        pageItem.isShowingCenterNow = false;
        pageItem.lastY.value = 0;

        prePageItem.top.value = nextPageItem.top.value;
        prePageItem.translationY.value = prePageItem.statusDefaultTranslationY;
        prePageItem.preStatus.value = prePageItem.statusDefaultTranslationY;
        prePageItem.zIndex.value = 2;
        prePageItem.isShowingCenterNow = false;
        prePageItem.lastY.value = 0;

        nextPageItem.top.value = curPageItemTopValue;
        nextPageItem.translationY.value = nextPageItem.statusDefaultTranslationY;
        nextPageItem.preStatus.value = nextPageItem.statusDefaultTranslationY;
        nextPageItem.zIndex.value = 1;
        nextPageItem.isShowingCenterNow = true;
        nextPageItem.lastY.value = 0;
      }, duration);
    };

    if (!goToNext) {
      if (pageItem.preStatus.value !== pageItem.statusNextTranslationY) {
        pageItem.preStatus.value = pageItem.statusNextTranslationY;
      }
      if (pageItem.translationY.value !== pageItem.statusNextTranslationY) {
        pageItem.translationY.value = withTiming(pageItem.statusNextTranslationY, {
          duration: pageItem.animatedDurationForGoToPreOrNext,
        });
        prePageItem.translationY.value = withTiming(
          prePageItem.statusNextTranslationY,
          { duration: prePageItem.animatedDurationForGoToPreOrNext },
          (finished?: boolean, _current?: AnimatableValue) => {
            if (finished) {
              // 通过 runOnJS + setTimeout 解决直接调用导致的闪动问题
              // worklet 线程到 js线程无法透传 对象, 所以方法为内部函数
              runOnJS(updateStatusAfterGoToNext)(0);
            }
          }
        );
      }
    } else {
      if (pageItem.preStatus.value !== pageItem.statusPreTranslationY) {
        pageItem.preStatus.value = pageItem.statusPreTranslationY;
      }
      if (pageItem.translationY.value !== pageItem.statusPreTranslationY) {
        pageItem.translationY.value = withTiming(pageItem.statusPreTranslationY, {
          duration: pageItem.animatedDurationForGoToPreOrNext,
        });
        nextPageItem.translationY.value = withTiming(
          nextPageItem.statusPreTranslationY,
          { duration: nextPageItem.animatedDurationForGoToPreOrNext },
          (finished?: boolean, _current?: AnimatableValue) => {
            if (finished) {
              // 通过 runOnJS + setTimeout 解决直接调用导致的闪动问题
              // worklet 线程到 js线程无法透传 对象, 所以方法为内部函数
              runOnJS(updateStatusAfterGoToPre)(0);
            }
          }
        );
      }
    }
  };

  public getPreAndNextPageItems = (curPageItem: PageItem): { prePageItem: PageItem; nextPageItem: PageItem } => {
    let prePageItem = this.getAPageItem();
    let nextPageItem = this.getCPageItem();
    switch (curPageItem.name) {
      case 'A': {
        prePageItem = this.getCPageItem();
        nextPageItem = this.getBPageItem();
        break;
      }
      case 'B': {
        prePageItem = this.getAPageItem();
        nextPageItem = this.getCPageItem();
        break;
      }
      case 'C': {
        prePageItem = this.getBPageItem();
        nextPageItem = this.getAPageItem();
        break;
      }
    }
    return { prePageItem: prePageItem, nextPageItem: nextPageItem };
  };

  public static getDefaultTop = (pageItemName: string, pageItemHeight: number, defaultCurTop: number = 0): number => {
    let defaultTop = 0;
    switch (pageItemName) {
      case 'A': {
        defaultTop = defaultCurTop - pageItemHeight;
        break;
      }
      case 'B': {
        defaultTop = defaultCurTop;
        break;
      }
      case 'C': {
        defaultTop = defaultCurTop + pageItemHeight;
        break;
      }
    }
    return defaultTop;
  };

  public reset = (filter?: (pageItem: PageItem) => PageItem) => {
    this.pageItemOriginArray.forEach((pageItem) => {
      pageItem.top.value = PullToNextHelper.getDefaultTop(pageItem.name, pageItem.height);
      pageItem.preStatus.value = pageItem.statusDefaultTranslationY;
      pageItem.translationY.value = pageItem.statusDefaultTranslationY;
      pageItem.isTouching.value = false;
      pageItem.isEnabledGesture.value = true;
      pageItem.lastY.value = 0;
      pageItem.touchingOffset.value = 0;
      pageItem.scrollY.value = 0;
      pageItem.nestedScrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
      filter?.(pageItem);
    });
  };
}

function useAnimatedScrollHandlerCustom(pageItem: PageItem) {
  pageItem.scrollHandler = useAnimatedScrollHandler(({ contentOffset, layoutMeasurement, contentSize }) => {
    let scrollHeight = layoutMeasurement.height + contentOffset.y;
    pageItem.scrollY.value = Math.round(contentOffset.y);
    pageItem.isCanPullingUpToDown.value = pageItem.scrollY.value === 0;
    pageItem.isCanPullingDownToUp.value = Math.round(scrollHeight) + 0.5 >= Math.round(contentSize.height);
  });
}

function useAnimatedPropsCustom(pageItem: PageItem) {
  pageItem.scrollViewProps = useAnimatedProps(() => {
    return {
      // only scroll if sheet is open
      // scrollEnabled: preStatus.value === STATUS_CURRENT_PAGE,
      scrollEnabled: true,
      // only bounce at bottom or not touching screen
      // bounces: scrollY.value > 0 || !isTouching.value,
    };
  });
  pageItem.containerAnimatedProps = useAnimatedProps<AnimateProps<ViewProps>>(() => ({
    // pointerEvents: curPageItemIsEnabledGesture.value ? 'auto' : 'none',
    pointerEvents: 'auto',
  }));
}

function usePanGestureCustom(pageItem: PageItem, pullToNextHelperRef: React.MutableRefObject<PullToNextHelper>) {
  const pullToNextHelper = pullToNextHelperRef.current;
  // const { prePageItem, nextPageItem } = pullToNextHelper.getPreAndNextPageItems(pageItem);

  const simulateScroll = () => {
    pageItem.nestedScrollViewRef?.current?.scrollTo?.({
      x: undefined,
      y: -pageItem.translationY.value + pageItem.statusDefaultTranslationY,
      animated: false,
    });
  };
  const handleLoading = (goToNext: boolean) => {
    setTimeout(() => {
      finishLoading(goToNext);
      pageItem.isEnabledGesture.value = true;
    }, 1500);
  };

  const finishLoading = (goToNext: boolean, goToNextPage: boolean = true) => {
    if (goToNextPage) {
      pullToNextHelper.goToPreOrNext(goToNext, pageItem);
    } else {
      if (pageItem.translationY.value !== pageItem.statusDefaultTranslationY) {
        pageItem.translationY.value = withTiming(pageItem.statusDefaultTranslationY, {
          duration: pageItem.animatedDurationForGoToDefault,
        });
      }
      if (pageItem.preStatus.value !== pageItem.statusDefaultTranslationY) {
        pageItem.preStatus.value = pageItem.statusDefaultTranslationY;
      }
    }
  };
  pageItem.panGesture = Gesture.Pan()
    .onBegin((e) => {
      pageItem.lastY.value = e.y;
      pageItem.isTouching.value = true;
    })
    .onUpdate((e) => {
      const isPullingUpToDown = e.y - pageItem.lastY.value > 0;
      // move sheet if top or scrollview or is closed state
      if (isPullingUpToDown && pageItem.scrollY.value === 0) {
        // current page changing translationY
        pageItem.translationY.value = pageItem.preStatus.value + e.translationY - pageItem.touchingOffset.value;
        // capture movement, but don't move sheet
      } else if (!isPullingUpToDown && pageItem.isCanPullingDownToUp.value) {
        pageItem.translationY.value = pageItem.preStatus.value + e.translationY - pageItem.touchingOffset.value;
      } else {
        // current page child scrollview nested scroll
        pageItem.touchingOffset.value = e.translationY;
      }

      // simulate scroll if user continues touching screen
      if (
        pageItem.preStatus.value !== pageItem.statusDefaultTranslationY &&
        pageItem.scrollY.value < pageItem.statusDefaultTranslationY
      ) {
        // worklet 线程到 js线程无法透传 对象, 所以方法为内部函数
        runOnJS(simulateScroll)();
      }
    })
    .onEnd((e) => {
      // default on worklet thread, https://github.com/software-mansion/react-native-gesture-handler/issues/2300

      // close sheet if velocity or travel is good
      if (e.translationY >= pageItem.statusHeaderTranslationY && pageItem.scrollY.value < 1) {
        pageItem.isEnabledGesture.value = false;
        pageItem.translationY.value = withTiming(
          pageItem.statusHeaderTranslationY,
          { duration: pageItem.animatedDurationForGoToLoading },
          (finished) => {
            if (finished) {
              // worklet 线程到 js线程无法透传 对象, 所以方法为内部函数
              runOnJS(handleLoading)(false);
            }
          }
        );
        pageItem.preStatus.value = pageItem.statusHeaderTranslationY;
        // start header loading
      } else if (e.translationY <= pageItem.statusFooterTranslationY && pageItem.isCanPullingDownToUp.value) {
        pageItem.isEnabledGesture.value = false;
        pageItem.translationY.value = withTiming(
          pageItem.statusFooterTranslationY,
          { duration: pageItem.animatedDurationForGoToLoading },
          (finished) => {
            if (finished) {
              // worklet 线程到 js线程无法透传 对象, 所以方法为内部函数
              runOnJS(handleLoading)(true);
            }
          }
        );
        pageItem.preStatus.value = pageItem.statusHeaderTranslationY;
        // start header loading
      } else {
        pageItem.translationY.value = withTiming(pageItem.preStatus.value, {
          duration: pageItem.animatedDurationForGoToLoading,
        });
      }
    })
    .onFinalize((_e) => {
      pageItem.isTouching.value = false;
      pageItem.touchingOffset.value = 0;
    })
    .simultaneousWithExternalGesture(pageItem.nestedScrollViewRef)
    .runOnJS(false);
}

function useAnimatedStyleCustom(pageItem: PageItem) {
  const translationY: SharedValue<number> = pageItem.translationY;
  pageItem.containerAnimatedStyle = useAnimatedStyle(() => {
    // const isPullingUpToDown = pageItem.translationY.value >= 0;
    // const isPullingDownToUp = pageItem.translationY.value < 0;
    return { transform: [{ translateY: translationY.value }] };
  });
}

export default function usePullToNextHelperRef(originPullToNextHelper: PullToNextHelper) {
  const pullToNextHelperRef = useRef<PullToNextHelper>(originPullToNextHelper);
  const aPageItemOrigin = pullToNextHelperRef.current.getAPageItem();
  const bPageItemOrigin = pullToNextHelperRef.current.getBPageItem();
  const cPageItemOrigin = pullToNextHelperRef.current.getCPageItem();

  useAnimatedScrollHandlerCustom(aPageItemOrigin);
  useAnimatedScrollHandlerCustom(bPageItemOrigin);
  useAnimatedScrollHandlerCustom(cPageItemOrigin);
  useAnimatedPropsCustom(aPageItemOrigin);
  useAnimatedPropsCustom(bPageItemOrigin);
  useAnimatedPropsCustom(cPageItemOrigin);
  useAnimatedStyleCustom(aPageItemOrigin);
  useAnimatedStyleCustom(bPageItemOrigin);
  useAnimatedStyleCustom(cPageItemOrigin);

  usePanGestureCustom(aPageItemOrigin, pullToNextHelperRef);
  usePanGestureCustom(bPageItemOrigin, pullToNextHelperRef);
  usePanGestureCustom(cPageItemOrigin, pullToNextHelperRef);

  return pullToNextHelperRef;
}
