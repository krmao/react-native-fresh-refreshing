import * as React from 'react';
import { Dimensions, FlatList, FlatListProps, StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';
import RefreshableWrapper from '../../src';
import EmptyComponent from './components/EmptyComponent';
import ListItem from './components/ListItem';
import DefaultLoader from './components/DefaultLoader';

type Item = string;

const AnimatedFlatlist = Animated.createAnimatedComponent<FlatListProps<Item>>(FlatList);

const { width } = Dimensions.get('window');

const data: Item[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function App() {
  const contentOffset = useSharedValue(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [listData, setListData] = React.useState<string[]>([]);

  const refreshSimulationHandler = () => {
    setIsLoading(true);
    setTimeout(async () => {
      setListData(data);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar translucent={false} backgroundColor={'#0384bd'} barStyle={'light-content'} />
      <View style={styles.container}>
        <RefreshableWrapper
          contentOffset={contentOffset}
          Loader={<DefaultLoader />}
          isLoading={isLoading}
          onRefresh={() => {
            refreshSimulationHandler();
          }}
        >
          <AnimatedFlatlist
            data={listData}
            bounces={false}
            overScrollMode={'never'}
            keyExtractor={(item: string) => item}
            renderItem={({ item }) => {
              return <ListItem item={item} />;
            }}
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            ListEmptyComponent={<EmptyComponent />}
          />
        </RefreshableWrapper>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: { width, flex: 1 },
  scrollContentContainer: {
    alignItems: 'center',
    backgroundColor: '#a9dfed',
    paddingBottom: 10,
  },
});
