import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';

export const Header = (
  <View style={{ height: 100, backgroundColor: 'darkblue', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 21, color: 'white', fontWeight: '600' }}>Header</Text>
  </View>
);
export const Footer = (
  <View style={{ height: 100, backgroundColor: 'darkblue', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 21, color: 'white', fontWeight: '600' }}>Footer</Text>
  </View>
);
export const ScrollViewContent = (
  <View style={{ backgroundColor: 'orange' }}>
    {[...Array(30).keys()].map((i) => (
      <Pressable
        key={i}
        style={{
          height: 50,
          borderBottomColor: 'rgba(0,0,0,.15)',
          borderBottomWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: 15,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
        onPress={() => {
          console.log('--', i);
        }}
      >
        <Text>Scroll Content {i + 1}</Text>
      </Pressable>
    ))}
  </View>
);
