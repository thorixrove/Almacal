import * as Sentry from '@sentry/react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useColorScheme } from 'nativewind';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/lib/theme';

// ponytail: temporary QA screen for the Sentry dashboard — delete it (and the Profile
// row that links here) once the alerts, issue grouping and log views are verified.

/** Named subclasses so the issue title in Sentry isn't just "Error". */
class MealAnalysisError extends Error {
  name = 'MealAnalysisError';
}
class PaywallPurchaseError extends Error {
  name = 'PaywallPurchaseError';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toast = (message: string) => Alert.alert('Sent to Sentry', message);

// ---------------------------------------------------------------- crashes

function crashInRender(): never {
  throw new Error("Cannot read property 'calories' of undefined");
}

/** Escapes the onPress call stack, so it lands in the global handler as uncaught. */
function uncaughtHandlerError() {
  setTimeout(() => {
    throw new MealAnalysisError('Meal analysis worker returned a malformed macro payload');
  }, 0);
}

function unhandledRejection() {
  // no .catch() on purpose — this is the shape a forgotten await leaves behind
  Promise.reject(new Error('POST /api/meals timed out after 30000ms'));
}

function nativeCrash() {
  Alert.alert('Hard crash the app?', 'The app closes immediately. The report uploads on relaunch.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Crash', style: 'destructive', onPress: () => Sentry.nativeCrash() },
  ]);
}

// ------------------------------------------------------- handled exceptions

function captureMealFailure() {
  Sentry.withScope((scope) => {
    scope.setTag('feature', 'meal-analysis');
    scope.setTag('model', 'gpt-4o-mini');
    scope.setLevel('error');
    scope.setContext('meal', {
      meal_id: 'meal_8f2a41',
      image_bytes: 2_184_302,
      retry_count: 2,
      trigger_run_id: 'run_01JQZ8K3',
    });
    Sentry.captureException(
      new MealAnalysisError('Vision model returned calories outside the plausible range (11840)'),
    );
  });
  toast('MealAnalysisError with tags + meal context');
}

function capturePurchaseFailure() {
  Sentry.withScope((scope) => {
    scope.setTag('feature', 'paywall');
    scope.setTag('store', 'app_store');
    // one issue per decline reason instead of one giant "purchase failed" bucket
    scope.setFingerprint(['paywall', 'purchase-failed', 'payment_declined']);
    scope.setContext('purchase', {
      product_id: 'bulky_pro_yearly',
      price_usd: 39.99,
      store_error_code: 'SKErrorDomain-2',
    });
    Sentry.captureException(new PaywallPurchaseError('Payment declined by the App Store'));
  });
  toast('PaywallPurchaseError with a custom fingerprint');
}

async function captureNetworkFailure() {
  Sentry.addBreadcrumb({ category: 'auth', message: 'Clerk token refreshed', level: 'info' });
  Sentry.addBreadcrumb({ category: 'ui', message: 'Tapped "Log meal"', level: 'info' });
  try {
    // real request to a host that cannot resolve — a genuine network failure, not a fake one
    await fetch('https://api.bulky-ai.invalid/v1/meals');
    toast('Request unexpectedly succeeded');
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag('feature', 'sync');
      scope.setContext('request', { url: 'https://api.bulky-ai.invalid/v1/meals', method: 'GET' });
      Sentry.captureException(error);
    });
    toast('Network failure with a breadcrumb trail');
  }
}

function captureCameraWarning() {
  Sentry.withScope((scope) => {
    scope.setTag('feature', 'camera');
    scope.setContext('permission', { status: 'denied', can_ask_again: false });
    Sentry.captureMessage('Camera permission denied after the user reached the scan tab', 'warning');
  });
  toast('captureMessage at warning level');
}

// ------------------------------------------------------------------- logs

const LOGS_TEMPLATES = [
  { key: 'debugSentry.traceCache', run: () => Sentry.logger.trace('Profile cache hit', { key: 'profile', age_ms: 412 }) },
  {
    key: 'debugSentry.debugCamera',
    run: () =>
      Sentry.logger.debug('Captured frame compressed', { width: 1024, quality: 0.8, bytes: 184302 }),
  },
  {
    key: 'debugSentry.infoMeal',
    run: () =>
      Sentry.logger.info('Meal logged', { calories: 642, protein_g: 38, source: 'camera' }),
  },
  {
    key: 'debugSentry.warnFormula',
    run: () =>
      Sentry.logger.warn('Plan fell back to Mifflin-St Jeor', {
        reason: 'model_returned_implausible_plan',
        calories: 2100,
      }),
  },
  {
    key: 'debugSentry.errorUpload',
    run: () =>
      Sentry.logger.error('Meal upload failed', {
        reason: 'HTTP 502 from /api/meals',
        image_bytes: 2_184_302,
      }),
  },
  {
    key: 'debugSentry.fatalDb',
    run: () =>
      Sentry.logger.fatal('Database unreachable, every write is failing', {
        db: 'neon-primary',
        consecutive_failures: 12,
      }),
  },
];

// ------------------------------------------------------------ performance

async function tracedMealAnalysis() {
  await Sentry.startSpan({ name: 'Analyze meal photo', op: 'meal.analyze' }, async () => {
    await Sentry.startSpan({ name: 'Compress image', op: 'image.compress' }, () => sleep(180));
    await Sentry.startSpan({ name: 'Upload to ImageKit', op: 'http.client' }, () => sleep(520));
    await Sentry.startSpan({ name: 'Vision model', op: 'gen_ai.chat' }, async (span) => {
      span.setAttribute('model', 'gpt-4o-mini');
      await sleep(1400);
    });
  });
  toast('Transaction "Analyze meal photo" with 3 child spans');
}

async function tracedFailingSpan() {
  try {
    await Sentry.startSpan({ name: 'Sync meals', op: 'db.sync' }, async () => {
      await sleep(250);
      throw new Error('Connection terminated unexpectedly');
    });
  } catch {
    toast('Span recorded with status internal_error');
  }
}

// -------------------------------------------------------------------- UI

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-[8px] ml-[26px] mt-[26px] text-[15px] font-medium text-[#8A8A90] dark:text-[#9A9AA0]">
      {children}
    </Text>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <View className="mx-[18px] overflow-hidden rounded-[20px] bg-white dark:bg-[#1C1C1E]">{children}</View>;
}

function Row({
  icon,
  label,
  onPress,
  tint,
  divider,
}: {
  icon: SFSymbol;
  label: string;
  onPress: () => void;
  tint?: string;
  divider?: boolean;
}) {
  const theme = useThemeColors();
  const effectiveTint = tint ?? theme.icon;

  return (
    <View className={divider ? 'border-t border-[#F1F1F3] dark:border-[#2C2C2E]' : undefined}>
      <Pressable onPress={onPress} className="active:bg-[#F7F7F9] dark:active:bg-[#242426]">
        <View className="flex-row items-center px-[18px] py-[15px]">
          <SymbolView name={icon} size={21} tintColor={effectiveTint} style={{ width: 24, height: 24 }} />
          <Text className="ml-[12px] flex-1 text-[17px]" style={{ color: effectiveTint }} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function DebugSentry() {
  const insets = useSafeAreaInsets();
  const [crash, setCrash] = useState(false);
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation();

  const LOGS = LOGS_TEMPLATES.map((log) => ({ ...log, label: t(log.key) }));

  if (crash) crashInRender();

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0B0B0C]" style={{ paddingTop: insets.top }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View className="mt-[10px] flex-row items-center px-[22px]">
          <Text className="flex-1 text-[34px] font-bold tracking-[-0.8px] text-black dark:text-white">
            {t('debugSentry.title')}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-[17px] text-[#8A8A90] dark:text-[#9A9AA0]">{t('debugSentry.close')}</Text>
          </Pressable>
        </View>
        <Text className="mt-[4px] px-[22px] text-[15px] text-[#8A8A90] dark:text-[#9A9AA0]">
          {t('debugSentry.description')}
        </Text>

        <SectionTitle>{t('debugSentry.crashes')}</SectionTitle>
        <Card>
          <Row
            icon="exclamationmark.triangle"
            label={t('debugSentry.uncaughtRender')}
            tint="#E5484D"
            onPress={() => setCrash(true)}
          />
          <Row
            divider
            icon="hand.tap"
            label={t('debugSentry.uncaughtHandler')}
            tint="#E5484D"
            onPress={uncaughtHandlerError}
          />
          <Row
            divider
            icon="arrow.triangle.2.circlepath"
            label={t('debugSentry.unhandledRejection')}
            tint="#E5484D"
            onPress={unhandledRejection}
          />
          <Row
            divider
            icon="bolt.trianglebadge.exclamationmark"
            label={t('debugSentry.nativeCrash')}
            tint="#E5484D"
            onPress={nativeCrash}
          />
        </Card>

        <SectionTitle>{t('debugSentry.handledErrors')}</SectionTitle>
        <Card>
          <Row icon="fork.knife" label={t('debugSentry.mealAnalysisFailed')} onPress={captureMealFailure} />
          <Row divider icon="creditcard" label={t('debugSentry.purchaseDeclined')} onPress={capturePurchaseFailure} />
          <Row divider icon="wifi.slash" label={t('debugSentry.networkRequestFailed')} onPress={captureNetworkFailure} />
          <Row divider icon="camera" label={t('debugSentry.cameraPermissionDenied')} onPress={captureCameraWarning} />
        </Card>

        <SectionTitle>{t('debugSentry.logs')}</SectionTitle>
        <Card>
          {LOGS.map((log, index) => (
            <Row
              key={log.key}
              divider={index > 0}
              icon="text.alignleft"
              label={log.label}
              onPress={() => {
                log.run();
                toast(t('debugSentry.sentToSentry'));
              }}
            />
          ))}
        </Card>

        <SectionTitle>{t('debugSentry.performance')}</SectionTitle>
        <Card>
          <Row icon="timer" label={t('debugSentry.slowMealAnalysis')} onPress={tracedMealAnalysis} />
          <Row divider icon="xmark.octagon" label={t('debugSentry.spanFails')} onPress={tracedFailingSpan} />
        </Card>

        <SectionTitle>{t('debugSentry.other')}</SectionTitle>
        <Card>
          <Row
            icon="mappin.and.ellipse"
            label={t('debugSentry.addBreadcrumbsOnly')}
            onPress={() => {
              Sentry.addBreadcrumb({ category: 'ui', message: 'Opened camera', level: 'info' });
              Sentry.addBreadcrumb({ category: 'ui', message: 'Retook photo', level: 'info' });
              toast(t('debugSentry.sentToSentry'));
            }}
          />
          {/* the feedback widget lives on Profile — it's a real feature, not a test */}
          <Row
            divider
            icon="paperplane"
            label={t('debugSentry.flushQueued')}
            onPress={async () => {
              await Sentry.flush();
              toast(t('debugSentry.sentToSentry'));
            }}
          />
        </Card>
      </ScrollView>
    </View>
  );
}