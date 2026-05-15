import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ChatScreen } from '../screens/ChatScreen';
import { SubjectPickerScreen } from '../screens/SubjectPickerScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const SUBJECT_COLORS: Record<string, string> = {
  Math: '#7C3AED',
  Science: '#059669',
  English: '#D97706',
};

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FAFAF9' },
        headerTintColor: '#1C1917',
        headerShadowVisible: false,
        headerBackTitle: 'Subjects',
      }}
    >
      <Stack.Screen
        name='SubjectPicker'
        component={SubjectPickerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='Chat'
        component={ChatScreen}
        options={({ route }) => ({
          title: `${route.params.subject} tutor`,
          headerTintColor: SUBJECT_COLORS[route.params.subject] ?? '#1C1917',
        })}
      />
    </Stack.Navigator>
  );
}
