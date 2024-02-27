import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';

export const Header = (
  <View
    style={{
      height: 52,
      backgroundColor: '#d9213955',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 5,
    }}
  >
    <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: 'bold' }}>HEADER</Text>
  </View>
);
export const Footer = (
  <View
    style={{
      height: 52,
      backgroundColor: '#d9213955',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 5,
    }}
  >
    <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: 'bold' }}>FOOTER</Text>
  </View>
);
export const ScrollViewContent = (
  <View style={{ backgroundColor: '#253f5b', borderRadius: 5 }}>
    {[...Array(30).keys()].map((i) => (
      <Pressable
        key={i}
        style={{
          height: 42,
          borderBottomColor: '#ffffff',
          borderBottomWidth: StyleSheet.hairlineWidth,
          justifyContent: 'center',
          alignItems: 'center',
          // backgroundColor: '#fec74b',
          backgroundColor: '#aec33a',
          elevation: 3,
          shadowOpacity: 0.5,
          shadowColor: '#000000',
          marginHorizontal: 5,
          marginTop: 5,
          marginBottom: i === 29 ? 5 : 0,
          borderRadius: 5,
        }}
        onPress={() => {
          console.log('you clicked', i);
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        >
          {i + 1}
        </Text>
      </Pressable>
    ))}
  </View>
);
