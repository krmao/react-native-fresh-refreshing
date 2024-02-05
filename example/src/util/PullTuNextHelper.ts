import { RefObject, useRef } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';
import { SharedValue } from 'react-native-reanimated';

export class Page {
  public name: string;
  public nestedScrollViewRef: RefObject<ScrollView>;
  public translationY: SharedValue<number>;

  constructor(name: string, nestedScrollViewRef: RefObject<ScrollView>) {
    this.name = name;
    this.nestedScrollViewRef = nestedScrollViewRef;
  }
}

export default class PullTuNextHelper {
  private readonly pageArray: Array<Page> = [
    new Page('A', useRef<ScrollView>(null)),
    new Page('B', useRef<ScrollView>(null)),
    new Page('C', useRef<ScrollView>(null)),
  ];
  private pageHeight: number = Dimensions.get('window').height;

  constructor() {}

  public getPrePage = (): Page => this.pageArray[0] as Page;
  public getCurPage = (): Page => this.pageArray[1] as Page;
  public getNextPage = (): Page => this.pageArray[2] as Page;
  public moveToPre = (callback?: () => void) => {
    let lastPage = this.pageArray.pop() as Page;
    this.pageArray.unshift(lastPage);
    callback?.();
  };
  public moveToNext = (callback?: () => void) => {
    let prePage = this.pageArray.shift() as Page;
    this.pageArray.push(prePage);
    callback?.();
  };
}
