import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isRunningInExpoGo } from "expo";
import { Stack, useNavigationContainerRef } from "expo-router";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { colorScheme } from "nativewind";

import { loadThemePreference } from "@/lib/theme";

import "@/global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file");
}

/**
 * Turns each screen change into a transaction. Expo Router runs on React Navigation, so
 * this is the integration it uses — there is no expo-router-specific one.
 *
 * Time to Initial Display and native frame timings need the native layer, which Expo Go
 * doesn't ship. This app uses a dev client, so both are on in practice.
 */
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

// safety net: hide the two harmless native Sentry messages on Android
LogBox.ignoreLogs([
  "[Native] [Sentry] addListener of NativeEventEmitter",
  "[Native] [Sentry] Failed to delete",
]);

Sentry.init({
  dsn: "https://f3be6c9687561e6cb48e1aad78153ba2@o4511578221182976.ingest.us.sentry.io/4512079896641536",
  // The SDK would default this to "development" on a dev build, which the dashboard's
  // environment filter hides unless you switch it. Explicit so it's visible in the UI.
  environment: __DEV__ ? "development" : "production",
  // Off by default: on Android it forwards native SDK logs to the console as red
  // "[Native] [Sentry] ..." errors that are harmless noise. Flip to __DEV__ only when you
  // need to check whether an envelope was actually sent.
  debug: false,
  sendDefaultPii: true,
  enableLogs: true,
  // ponytail: sample everything while the app is small; drop to ~0.1 once traffic costs quota
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableNativeFramesTracking: !isRunningInExpoGo(),
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllImages: false,
      maskAllText: false,
      maskAllVectors: false,
    }),
    navigationIntegration,
  ],
});

function RootLayout() {
  // per-instance, not module scope, so a server render can't share one client
  const [queryClient] = useState(() => new QueryClient());

  // Stable object from expo-router's store; React attaches `.current` during commit,
  // so it is already populated by the time this effect runs.
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <ThemeGate />
        <SentryUser />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </ClerkProvider>
  );
}


function ThemeGate() {
  useEffect(() => {
    loadThemePreference().then((preference) => colorScheme.set(preference))
  }, [])

  return null
}

/**
 * Attaches the signed-in user to every log and error Sentry sends. Lives here rather
 * than in `(app)/_layout` so it also covers onboarding, which sits outside that group.
 */
function SentryUser() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    Sentry.setUser(userId ? { id: userId } : null); // null on sign-out, so logs don't
  }, [isLoaded, userId]); //                           keep carrying the previous user

  return null;
}

export default Sentry.wrap(RootLayout);