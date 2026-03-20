import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { AudioToSRTScreen } from './src/screens/AudioToSRTScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { ManualEditorHomeScreen } from './src/screens/ManualEditorHomeScreen';
import { initDB } from './src/storage/db';
import { SRTProject } from './src/types';

export type RootStackParamList = {
  Home: undefined;
  AudioToSRT: undefined;
  ManualEditorHome: undefined;
  Editor: { project: SRTProject };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Initialize SQLite database on app startup
    initDB().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AudioToSRT" component={AudioToSRTScreen} />
          <Stack.Screen name="ManualEditorHome" component={ManualEditorHomeScreen} />
          <Stack.Screen name="Editor" component={EditorScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
