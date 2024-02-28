import { RefObject, useRef } from 'react';
import { Gesture, PanGesture, ScrollView } from 'react-native-gesture-handler';
import {
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

  public constructor(
    name: string,
    height: number,
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
export class PullTuNextHelper {
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

  public getPrePageItemOriginNestedScrollViewRef = (): RefObject<ScrollView> => {
    return this.getPrePageItemOrigin().nestedScrollViewRef;
  };
  public getCurPageItemOriginNestedScrollViewRef = (): RefObject<ScrollView> => {
    return this.getCurPageItemOrigin().nestedScrollViewRef;
  };
  public getNextPageItemOriginNestedScrollViewRef = (): RefObject<ScrollView> => {
    return this.getNextPageItemOrigin().nestedScrollViewRef;
  };
  //endregion

  //region 当前最新的
  public getPrePageItem = (): PageItem => this.pageItemArray[0] as PageItem;
  public getCurPageItem = (): PageItem => this.pageItemArray[1] as PageItem;
  public getNextPageItem = (): PageItem => this.pageItemArray[2] as PageItem;
  public moveToPreItem = (callback?: () => void) => {
    let lastPageItem = this.pageItemArray.pop() as PageItem;
    this.pageItemArray.unshift(lastPageItem);
    callback?.();
  };
  public moveToNextItem = (callback?: () => void) => {
    let prePageItem = this.pageItemArray.shift() as PageItem;
    this.pageItemArray.push(prePageItem);
    callback?.();
  };

  public getPrePageItemTranslationY = (): SharedValue<number> => {
    return this.getPrePageItem().translationY;
  };
  public getCurPageItemTranslationY = (): SharedValue<number> => {
    return this.getCurPageItem().translationY;
  };
  public getNextPageItemTranslationY = (): SharedValue<number> => {
    return this.getNextPageItem().translationY;
  };

  public getPrePageItemIsTouching = (): SharedValue<boolean> => {
    return this.getPrePageItem().isTouching;
  };
  public getCurPageItemIsTouching = (): SharedValue<boolean> => {
    return this.getCurPageItem().isTouching;
  };
  public getNextPageItemIsTouching = (): SharedValue<boolean> => {
    return this.getNextPageItem().isTouching;
  };

  public getPrePageItemIsEnabledGesture = (): SharedValue<boolean> => {
    return this.getPrePageItem().isEnabledGesture;
  };
  public getCurPageItemIsEnabledGesture = (): SharedValue<boolean> => {
    return this.getCurPageItem().isEnabledGesture;
  };
  public getNextPageItemIsEnabledGesture = (): SharedValue<boolean> => {
    return this.getNextPageItem().isEnabledGesture;
  };
  //endregion

  public reset = () => {
    this.pageItemArray = this.pageItemOriginArray.map((pageItem) => {
      pageItem.preStatus.value = 0;
      pageItem.translationY.value = 0;
      pageItem.isTouching.value = false;
      pageItem.isEnabledGesture.value = true;
      pageItem.lastY.value = 0;
      pageItem.touchingOffset.value = 0;
      pageItem.scrollY.value = 0;
      pageItem.nestedScrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
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
    return {
      transform: [{ translateY: pageItem.translationY.value }],
    };
  });
}

function usePanGestureCustom(pageItem: PageItem) {
  const PAGE_ITEM_HEIGHT = pageItem.height;
  const STATUS_CURRENT_PAGE = 0; // 默认状态
  const STATUS_CURRENT_PAGE_HEADER_LOADING = 100; // header 加载中
  const STATUS_CURRENT_PAGE_FOOTER_LOADING = -100; // footer 加载中
  const STATUS_PRE_PAGE = -PAGE_ITEM_HEIGHT + 100; // 上一页
  const STATUS_NEXT_PAGE = PAGE_ITEM_HEIGHT - 100; // 下一页
  const preStatus = pageItem.preStatus;

  if (!pageItem.panGesture) {
    const simulateScroll = () => {
      pageItem.nestedScrollViewRef?.current?.scrollTo?.({
        x: undefined,
        y: -pageItem.translationY.value + STATUS_CURRENT_PAGE,
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
          if (pageItem.translationY.value !== STATUS_NEXT_PAGE) {
            pageItem.translationY.value = withTiming(STATUS_NEXT_PAGE, { duration: 200 });
          }
          if (preStatus.value !== STATUS_NEXT_PAGE) {
            preStatus.value = STATUS_NEXT_PAGE;
          }
        } else {
          if (pageItem.translationY.value !== STATUS_PRE_PAGE) {
            pageItem.translationY.value = withTiming(STATUS_PRE_PAGE, { duration: 200 });
          }
          if (preStatus.value !== STATUS_PRE_PAGE) {
            preStatus.value = STATUS_PRE_PAGE;
          }
        }
      } else {
        if (pageItem.translationY.value !== STATUS_CURRENT_PAGE) {
          pageItem.translationY.value = withTiming(STATUS_CURRENT_PAGE, { duration: 200 });
        }
        if (preStatus.value !== STATUS_CURRENT_PAGE) {
          preStatus.value = STATUS_CURRENT_PAGE;
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
          pageItem.translationY.value = preStatus.value + e.translationY - pageItem.touchingOffset.value;
          // capture movement, but don't move sheet
        } else if (!isPullingUpToDown && pageItem.isCanPullingDownToUp.value) {
          pageItem.translationY.value = preStatus.value + e.translationY - pageItem.touchingOffset.value;
          // currentPageTranslationY.value = -currentPageTranslationY.value;
          // currentPageTranslationY.value = e.translationY;
        } else {
          // current page child scrollview nested scroll
          pageItem.touchingOffset.value = e.translationY;
        }

        // simulate scroll if user continues touching screen
        if (preStatus.value !== STATUS_CURRENT_PAGE && pageItem.scrollY.value < STATUS_CURRENT_PAGE) {
          runOnJS(simulateScroll)();
        }
      })
      .onEnd((e) => {
        // default on worklet thread, https://github.com/software-mansion/react-native-gesture-handler/issues/2300

        // close sheet if velocity or travel is good
        if (e.translationY >= STATUS_CURRENT_PAGE_HEADER_LOADING && pageItem.scrollY.value < 1) {
          pageItem.isEnabledGesture.value = false;
          pageItem.translationY.value = withTiming(
            STATUS_CURRENT_PAGE_HEADER_LOADING,
            { duration: 200 },
            (finished) => {
              if (finished) {
                runOnJS(handleLoading)(true);
              }
            }
          );
          preStatus.value = STATUS_CURRENT_PAGE_HEADER_LOADING;
          // start header loading
        } else if (e.translationY <= STATUS_CURRENT_PAGE_FOOTER_LOADING && pageItem.isCanPullingDownToUp.value) {
          pageItem.isEnabledGesture.value = false;
          pageItem.translationY.value = withTiming(
            STATUS_CURRENT_PAGE_FOOTER_LOADING,
            { duration: 200 },
            (finished) => {
              if (finished) {
                runOnJS(handleLoading)(false);
              }
            }
          );
          preStatus.value = STATUS_CURRENT_PAGE_HEADER_LOADING;
          // start header loading
        } else {
          pageItem.translationY.value = withTiming(preStatus.value, { duration: 200 });
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
}

export default function usePullToNextHelperRef(originPullToNextHelper: PullTuNextHelper) {
  const pullToNextHelperRef = useRef<PullTuNextHelper>(originPullToNextHelper);
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
  usePanGestureCustom(prePageItemOrigin);
  usePanGestureCustom(curPageItemOrigin);
  usePanGestureCustom(nextPageItemOrigin);

  return pullToNextHelperRef;
}
