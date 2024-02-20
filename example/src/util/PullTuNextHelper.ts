import { RefObject } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';

export class PageItem {
  public readonly name: string;
  public readonly height: number;
  public readonly translationY: SharedValue<number>;
  public readonly nestedScrollViewRef: RefObject<ScrollView>;

  public constructor(
    name: string,
    height: number,
    translationY: SharedValue<number>,
    nestedScrollViewRef: RefObject<ScrollView>
  ) {
    this.name = name;
    this.height = height;
    this.translationY = translationY;
    this.nestedScrollViewRef = nestedScrollViewRef;
  }

  public toString(): string {
    return (
      `(name:${this.name}, ` +
      `height:${this.height}, ` +
      `translationY:${this.translationY.value}, ` +
      `nestedScrollViewRef:${this.nestedScrollViewRef.current})`
    );
  }
}

// noinspection JSUnusedGlobalSymbols
export default class PullTuNextHelper {
  private readonly pageItemArray: Array<PageItem>;

  constructor(pageItemArray: Array<PageItem>) {
    this.pageItemArray = pageItemArray;
  }

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
}
