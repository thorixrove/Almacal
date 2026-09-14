import * as Sentry from '@sentry/react-native';
import { useRealtimeRun } from '@trigger.dev/react-hooks';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MACROS } from '@/constants/macros';
import { useLogMeal, type LoggedMeal } from '@/lib/api';
import type { analyzeMeal } from '@/trigger/analyze-meal';


type Shot = { uri: string; base64: string };

export default function Camera() {
  return (
    <div>
      
    </div>
  )
}
