import { Pressable, Text, View } from 'react-native';
import React from 'react';

export const Header = ({ name, backgroundColor }: { name: string; backgroundColor: string }) => {
  return (
    <View
      style={{
        height: 52,
        backgroundColor: backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
      }}
    >
      <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: 'bold' }}>HEADER {name}</Text>
    </View>
  );
};
export const Footer = ({ name, backgroundColor }: { name: string; backgroundColor: string }) => {
  return (
    <View
      style={{
        height: 52,
        backgroundColor: backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
      }}
    >
      <Text style={{ fontSize: 16, color: '#ffffff', fontWeight: 'bold' }}>FOOTER {name}</Text>
    </View>
  );
};
export const ScrollViewContent = ({
  name,
  backgroundColor,
  textBackgroundColor,
}: {
  name: string;
  backgroundColor: string;
  textBackgroundColor: string;
}) => {
  return (
    <View style={{ backgroundColor: backgroundColor, borderRadius: 5 }}>
      {[...Array(30).keys()].map((i) => (
        <Pressable
          key={i}
          style={{
            height: 42,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: textBackgroundColor,
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
            {name} {i + 1}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
