import { RefObject } from 'react';
import { PanGesture, ScrollView } from 'react-native-gesture-handler';
import { AnimatedStyleProp, SharedValue } from 'react-native-reanimated';
import { ImageStyle, NativeScrollEvent, NativeSyntheticEvent, TextStyle, ViewStyle } from 'react-native';

export class PageItem {
  public readonly name: string;
  public readonly height: number;
  public readonly translationY: SharedValue<number>;
  public readonly isTouching: SharedValue<boolean>;
  public readonly isEnabledGesture: SharedValue<boolean>;
  public readonly lastY: SharedValue<number>;
  public readonly touchingOffset: SharedValue<number>;
  public readonly scrollY: SharedValue<number>;
  public readonly isCanPullingUpToDown: SharedValue<boolean>;
  public readonly isCanPullingDownToUp: SharedValue<boolean>;
  private _scrollHandler: ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | null = null;
  private _panGesture: PanGesture | null = null;
  private _scrollViewProps: Partial<any> | null = null;
  private _sheetAnimatedStyle: AnimatedStyleProp<ViewStyle | ImageStyle | TextStyle> | null = null;
  public readonly nestedScrollViewRef: RefObject<ScrollView>;

  public constructor(
    name: string,
    height: number,
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

  get scrollHandler(): ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | null {
    return this._scrollHandler;
  }

  get panGesture(): PanGesture | null {
    return this._panGesture;
  }

  get scrollViewProps(): Partial<any> | null {
    return this._scrollViewProps;
  }

  get sheetAnimatedStyle(): AnimatedStyleProp<ViewStyle | ImageStyle | TextStyle> | null {
    return this._sheetAnimatedStyle;
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

  set sheetAnimatedStyle(sheetAnimatedStyle: AnimatedStyleProp<ViewStyle | ImageStyle | TextStyle>) {
    this._sheetAnimatedStyle = sheetAnimatedStyle;
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
export default class PullTuNextHelper {
  private readonly pageItemArray: Array<PageItem>;
  private readonly pageItemOriginArray: Array<PageItem>;

  constructor(pageItemOriginArray: Array<PageItem>) {
    this.pageItemOriginArray = pageItemOriginArray.map((item) => {
      return {
        ...item,
        // translationY: { value: item.translationY.value },
      };
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
}
