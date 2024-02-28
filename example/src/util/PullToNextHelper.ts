import React, { RefObject, useRef } from 'react';
import { Gesture, PanGesture, ScrollView } from 'react-native-gesture-handler';
import {
  AnimatableValue,
  runOnJS,
  SharedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export class PageItem {
  public readonly name: string;
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
  public readonly nestedScrollViewRef: RefObject<ScrollView>;
  public readonly statusDefaultTranslation: number = 0; // 默认状态
  public readonly statusHeaderTranslation: number = 52; // HEADER 加载中
  public readonly statusFooterTranslation: number = -52; // FOOTER 加载中
  public readonly statusPreTranslation: number = 0; // 上一页
  public readonly statusNextTranslation: number = 0; // 下一页

  public constructor(
    name: string,
    height: number,
    statusDefaultTranslation: number,
    statusHeaderTranslation: number,
    statusFooterTranslation: number,
    statusPreTranslation: number,
    statusNextTranslation: number,
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
    this.statusDefaultTranslation = statusDefaultTranslation;
    this.statusHeaderTranslation = statusHeaderTranslation;
    this.statusFooterTranslation = statusFooterTranslation;
    this.statusPreTranslation = statusPreTranslation;
    this.statusNextTranslation = statusNextTranslation;
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

  set scrollHandler(scrollHandler: (event: NativeSyntheticEvent<NativeScrollEvent>) => void) {
    this._scrollHandler = scrollHandler;
  }

  set panGesture(panGesture: PanGesture) {
    this._panGesture = panGesture;
  }

  set scrollViewProps(scrollViewProps: Partial<any>) {
    this._scrollViewProps = scrollViewProps;
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
  public pageItemArray: Array<PageItem>;
  public readonly pageItemOriginArray: Array<PageItem>;

  constructor(pageItemOriginArray: Array<PageItem>) {
    this.pageItemOriginArray = pageItemOriginArray.map((item) => {
      return { ...item };
    }) as Array<PageItem>;
    this.pageItemArray = [...pageItemOriginArray];
  }

  //region 最初原始的
  public getPrePageItemOrigin = (): PageItem => this.pageItemOriginArray[0] as PageItem;
  public getCurPageItemOrigin = (): PageItem => this.pageItemOriginArray[1] as PageItem;
  public getNextPageItemOrigin = (): PageItem => this.pageItemOriginArray[2] as PageItem;
  //endregion

  public getPreAndNextPageItems = (curPageItem: PageItem): { prePageItem: PageItem; nextPageItem: PageItem } => {
    let prePageItem = this.getPrePageItemOrigin();
    let nextPageItem = this.getNextPageItemOrigin();
    switch (curPageItem.name) {
      case 'A': {
        prePageItem = this.getNextPageItemOrigin();
        nextPageItem = this.getCurPageItemOrigin();
        break;
      }
      case 'B': {
        prePageItem = this.getPrePageItemOrigin();
        nextPageItem = this.getNextPageItemOrigin();
        break;
      }
      case 'C': {
        prePageItem = this.getCurPageItemOrigin();
        nextPageItem = this.getPrePageItemOrigin();
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
    this.pageItemArray = this.pageItemOriginArray.map((pageItem) => {
      pageItem.top.value = PullToNextHelper.getDefaultTop(pageItem.name, pageItem.height);
      pageItem.preStatus.value = pageItem.statusDefaultTranslation;
      pageItem.translationY.value = pageItem.statusDefaultTranslation;
      pageItem.isTouching.value = false;
      pageItem.isEnabledGesture.value = true;
      pageItem.lastY.value = 0;
      pageItem.touchingOffset.value = 0;
      pageItem.scrollY.value = 0;
      pageItem.nestedScrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
      if (filter) {
        pageItem = filter(pageItem);
      }
      return { ...pageItem } as PageItem;
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
}

export function useAnimatedStyleCustom(pageItem: PageItem) {
  return useAnimatedStyle(() => {
    // const isPullingUpToDown = pageItem.translationY.value >= 0;
    // const isPullingDownToUp = pageItem.translationY.value < 0;
    return { transform: [{ translateY: pageItem.translationY.value }] };
  });
}

function usePanGestureCustom(pageItem: PageItem, pullToNextHelperRef: React.MutableRefObject<PullToNextHelper>) {
  if (pageItem.panGesture) {
    return;
  }

  const pullToNextHelper = pullToNextHelperRef.current;
  const { prePageItem, nextPageItem } = pullToNextHelper.getPreAndNextPageItems(pageItem);

  const simulateScroll = () => {
    pageItem.nestedScrollViewRef?.current?.scrollTo?.({
      x: undefined,
      y: -pageItem.translationY.value + pageItem.statusDefaultTranslation,
      animated: false,
    });
  };
  const handleLoading = (isHeader: boolean) => {
    setTimeout(() => {
      finishLoading(isHeader);
      pageItem.isEnabledGesture.value = true;
    }, 1500);
  };
  const finishLoading = (isHeader: boolean, goToNextPage: boolean = true) => {
    if (goToNextPage) {
      if (isHeader) {
        if (pageItem.preStatus.value !== pageItem.statusNextTranslation) {
          pageItem.preStatus.value = pageItem.statusNextTranslation;
        }
        if (pageItem.translationY.value !== pageItem.statusNextTranslation) {
          pageItem.translationY.value = withTiming(pageItem.statusNextTranslation, { duration: 200 });
          prePageItem.translationY.value = withTiming(
            prePageItem.statusNextTranslation,
            { duration: 200 },
            (finished?: boolean, _current?: AnimatableValue) => {
              if (finished) {
                const curPageItemTopValue = pageItem.top.value;
                pageItem.top.value = nextPageItem.top.value;
                pageItem.translationY.value = pageItem.statusDefaultTranslation;
                pageItem.preStatus.value = pageItem.statusDefaultTranslation;

                nextPageItem.top.value = prePageItem.top.value;
                nextPageItem.translationY.value = nextPageItem.statusDefaultTranslation;
                nextPageItem.preStatus.value = nextPageItem.statusDefaultTranslation;

                prePageItem.top.value = curPageItemTopValue;
                prePageItem.translationY.value = prePageItem.statusDefaultTranslation;
                prePageItem.preStatus.value = prePageItem.statusDefaultTranslation;
              }
            }
          );
        }
      } else {
        if (pageItem.preStatus.value !== pageItem.statusPreTranslation) {
          pageItem.preStatus.value = pageItem.statusPreTranslation;
        }
        if (pageItem.translationY.value !== pageItem.statusPreTranslation) {
          pageItem.translationY.value = withTiming(pageItem.statusPreTranslation, { duration: 200 });
          nextPageItem.translationY.value = withTiming(
            nextPageItem.statusPreTranslation,
            { duration: 200 },
            (finished?: boolean, _current?: AnimatableValue) => {
              if (finished) {
                const curPageItemTopValue = pageItem.top.value;
                pageItem.top.value = prePageItem.top.value;
                pageItem.translationY.value = pageItem.statusDefaultTranslation;
                pageItem.preStatus.value = pageItem.statusDefaultTranslation;

                prePageItem.top.value = nextPageItem.top.value;
                prePageItem.translationY.value = prePageItem.statusDefaultTranslation;
                prePageItem.preStatus.value = prePageItem.statusDefaultTranslation;

                nextPageItem.top.value = curPageItemTopValue;
                nextPageItem.translationY.value = nextPageItem.statusDefaultTranslation;
                nextPageItem.preStatus.value = nextPageItem.statusDefaultTranslation;
              }
            }
          );
        }
      }
    } else {
      if (pageItem.translationY.value !== pageItem.statusDefaultTranslation) {
        pageItem.translationY.value = withTiming(pageItem.statusDefaultTranslation, { duration: 200 });
      }
      if (pageItem.preStatus.value !== pageItem.statusDefaultTranslation) {
        pageItem.preStatus.value = pageItem.statusDefaultTranslation;
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
        pageItem.preStatus.value !== pageItem.statusDefaultTranslation &&
        pageItem.scrollY.value < pageItem.statusDefaultTranslation
      ) {
        runOnJS(simulateScroll)();
      }
    })
    .onEnd((e) => {
      // default on worklet thread, https://github.com/software-mansion/react-native-gesture-handler/issues/2300

      // close sheet if velocity or travel is good
      if (e.translationY >= pageItem.statusHeaderTranslation && pageItem.scrollY.value < 1) {
        pageItem.isEnabledGesture.value = false;
        pageItem.translationY.value = withTiming(pageItem.statusHeaderTranslation, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(handleLoading)(true);
          }
        });
        pageItem.preStatus.value = pageItem.statusHeaderTranslation;
        // start header loading
      } else if (e.translationY <= pageItem.statusFooterTranslation && pageItem.isCanPullingDownToUp.value) {
        pageItem.isEnabledGesture.value = false;
        pageItem.translationY.value = withTiming(pageItem.statusFooterTranslation, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(handleLoading)(false);
          }
        });
        pageItem.preStatus.value = pageItem.statusHeaderTranslation;
        // start header loading
      } else {
        pageItem.translationY.value = withTiming(pageItem.preStatus.value, { duration: 200 });
      }
    })
    .onFinalize((_e) => {
      // stopped touching screen
      pageItem.isTouching.value = false;
      pageItem.touchingOffset.value = 0;
    })
    .simultaneousWithExternalGesture(pageItem.nestedScrollViewRef)
    .runOnJS(false);
}

export default function usePullToNextHelperRef(originPullToNextHelper: PullToNextHelper) {
  const pullToNextHelperRef = useRef<PullToNextHelper>(originPullToNextHelper);
  const pullToNextHelper = pullToNextHelperRef.current;

  const prePageItemOrigin = pullToNextHelper.getPrePageItemOrigin();
  const curPageItemOrigin = pullToNextHelper.getCurPageItemOrigin();
  const nextPageItemOrigin = pullToNextHelper.getNextPageItemOrigin();

  useAnimatedScrollHandlerCustom(prePageItemOrigin);
  useAnimatedScrollHandlerCustom(curPageItemOrigin);
  useAnimatedScrollHandlerCustom(nextPageItemOrigin);
  useAnimatedPropsCustom(prePageItemOrigin);
  useAnimatedPropsCustom(curPageItemOrigin);
  useAnimatedPropsCustom(nextPageItemOrigin);
  usePanGestureCustom(prePageItemOrigin, pullToNextHelperRef);
  usePanGestureCustom(curPageItemOrigin, pullToNextHelperRef);
  usePanGestureCustom(nextPageItemOrigin, pullToNextHelperRef);

  return pullToNextHelperRef;
}
