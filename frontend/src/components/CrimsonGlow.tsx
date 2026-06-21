import React from 'react';
import { View, Image, Platform } from 'react-native';

// decorative background glow matching Figma "Ellipse 1" — sits bottom-right, mostly off-screen
// on web we fake it with CSS blur since RN's blurRadius only works on images because earlier i was testing it on web 
const WEB_GLOW: object = {
  position: 'absolute',
  right: -230,
  bottom: -150,
  width: 520,
  height: 490,
  borderRadius: 260,
  backgroundColor: 'rgba(113, 0, 20, 1)',
  opacity: 0.24,
  filter: 'blur(150px)',
};

export default function CrimsonGlow() {
  if (Platform.OS === 'web') {
    return <View style={{ ...(WEB_GLOW as any), pointerEvents: 'none' }} />;
  }
  return (
    <Image
      source={require('../../assets/icons/Ellipse 7.png')}
      style={{ position: 'absolute', bottom: -80, right: -100, width: 380, height: 380, opacity: 0.5 }}
      resizeMode="contain"
    />
  );
}
