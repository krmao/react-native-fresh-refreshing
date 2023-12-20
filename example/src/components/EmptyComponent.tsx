import * as React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { height, width } = Dimensions.get('window');

const EmptyComponent = () => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>LIST EMPTY COMPONENT</Text>
    </View>
  );
};

export default EmptyComponent;

const styles = StyleSheet.create({
  emptyContainer: {
    height: height,
    width: width,
    backgroundColor: '#a9dfed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#0384bd',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
