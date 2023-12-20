import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ListItem = (props: { item: string }) => {
  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{props.item}</Text>
      </View>
    </View>
  );
};

export default ListItem;

const styles = StyleSheet.create({
  itemContainer: {
    height: 100,
    minWidth: '100%',
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#a9dfed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  itemContent: {
    flex: 1,
    width: '100%',
    minWidth: '100%',
    backgroundColor: '#0384bd',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
