import { useAuth, useUser } from '@clerk/expo';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import * as Sentry from '@sentry/react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { openBrowserAsync } from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import { type ComponentProps, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { deleteAccount } from '@/lib/api';
import { useThemeColors } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const LEGAL_ORIGIN = 'https://example.com'; // TODO: ganti ke domain legal asli sebelum rilis
const PRIVACY_URL = `${LEGAL_ORIGIN}/privacy`;
const TERMS_URL = `${LEGAL_ORIGIN}/terms`;


const soon = () => Alert.alert('Coming soon')

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="ml-[26px] mb-[8px] mt-[26px] text-[15px] font-medium text-[#8A8A90] dark:text-[#9A9AA0]">
      {children}
    </Text>
  )
}


function Card({ children }: { children: ReactNode }) {
  return <View className="mx-[18px] overflow-hidden rounded-[20px] bg-white dark:bg-[#1C1C1E]">{children}</View>
}


function Row({
  icon,
  label,
  value,
  onPress,
  tint,
  divider,
}: {
  icon: IconName
  label: string
  value?: string
  onPress?: () => void
  tint?: string
  divider?: boolean
}) {
  const theme = useThemeColors()
  const effectiveTint = tint ?? theme.icon

  const body = (
    <View className="flex-row items-center px-[18px] py-[15px]">
      <Ionicons name={icon} size={21} color={effectiveTint} style={{ width: 24, height: 24 }} />
      <Text className="ml-[12px] flex-1 text-[17px]" style={{ color: effectiveTint }} numberOfLines={1}>
        {label}
      </Text>
      {value ? <Text className="text-[16px] text-[#8A8A90] dark:text-[#9A9AA0]">{value}</Text> : null}
      {onPress ? (
        <Ionicons
        name='chevron-forward'
        size={16}
        color={theme.chevron}
        style={{ width: 16, height: 16, marginLeft: 6}}
        />
      ) : null}
    </View>
  )


  return (
    <View className={divider ? 'border-t border-[#F1F1F3] dark:border-[#2C2C2E]' : undefined}>
      {onPress ? (
        <Pressable onPress={onPress} className="active:bg-[#F7F7F9] dark:active:bg-[#242426]">
          {body}
        </Pressable>
      ) : (
        body
      )}
    </View>
  )
}

export default function profile() {
  const insets = useSafeAreaInsets()
  const { signOut, getToken } = useAuth()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const theme = useThemeColors()
  const { colorScheme: resolvedScheme } = useColorScheme()

  const memberSince = user?.createdAt
    ? user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—'

    const confirmSignOut = () =>
      Alert.alert(
        'Sign out?',
        'You can sign back in anytime.',
        [
          { text: 'No', style: 'cancel'},
          {
            text: 'Yes',
            style: 'destructive',
            onPress: async () => {
              await signOut()
              queryClient.clear()
              router.replace('/sign-in')
            },
          },
        ],
      )

  const confirmDelete = () =>
    Alert.alert(
      'Delete your account?',
      'This permanently removes your profile, your targets and every meal you have logged. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(await getToken())
              queryClient.clear()
              await signOut().catch(() => { })
            } catch (error) {
              Sentry.logger.error('Account deletion failed', { reason: String(error) })
              Alert.alert('We couldn’t delete your account', 'Please try again in a moment.')
            }
          },
        },
      ],
    )

  return (
    <View collapsable={false} className="flex-1 bg-[#F4F4F6] dark:bg-[#0B0B0C]" style={{ paddingTop: insets.top }}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'}/>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 28 }}>
        <Text className="ml-[22px] mt-[10px] text-[34px] font-bold tracking-[-0.8px] text-black dark:text-white">
          Profile
        </Text>

        <View className="mx-[18px] mt-[18px] flex-row items-center rounded-[20px] bg-white dark:bg-[#1C1C1E] p-[16px]">
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={{ width: 56, height: 56, borderRadius: 28 }}
            />
          ) : (
            <View className="h-[56px] w-[56px] items-center justify-center rounded-full bg-[#F1F1F6] dark:bg-[#2C2C2E]">
              <Ionicons name="person" size={26} color={theme.subtext} />
            </View>
          )}
          <View className="ml-[14px] flex-1">
            <Text numberOfLines={1} className="text-[20px] font-bold text-black dark:text-white">
              {user?.fullName ?? user?.firstName ?? 'Your Profile'}
            </Text>
            <Text numberOfLines={1} className="mt-[2px] text-[15px] text-[#8A8A90] dark:text-[#9A9AA0]">
              {user?.primaryEmailAddress?.emailAddress ?? 'Signed in'}
            </Text>
          </View>
        </View>


        <SectionTitle>Account</SectionTitle>
        <Card>
          <Row icon='calendar' label="Member since" value={memberSince} />
          <Row
            divider
            icon="card"
            label="Personal Details"
            onPress={() => router.push('/personal-details')}
          />
          <Row divider icon="settings" label="Preferences" onPress={() => router.push('/preferences')} />
          <Row divider icon="globe" label="Language" onPress={soon} />
          <Row divider icon="people" label="Upgrade to Family Plan" onPress={soon} />
        </Card>

        <SectionTitle>About</SectionTitle>
        <Card>
          <Row
            icon='hand-left'
            label='Privacy Policy'
            onPress={() => openBrowserAsync(PRIVACY_URL)}
          />
          <Row
            divider
            icon='document-text'
            label='Terms of Service'
            onPress={() => openBrowserAsync(TERMS_URL)}
          />
          <Row
            divider
            icon='bug'
            label='Sentry test bench'
            onPress={() => router.push('/debug-sentry')}
          />
        </Card>

        <SectionTitle>Support</SectionTitle>
        <Card>
          <Row
            icon='chatbubbles'
            label='Send feedback'
            onPress={() => Sentry.showFeedbackWidget()}
          />
        </Card>

        <View className="mt-[26px]">
          <Card>
            <Row
              icon='log-out'
              label='Sign out'
              onPress={confirmSignOut}
            />
          </Card>
        </View>

        <View className="mt-[10px]">
          <Card>
            <Row icon="trash" label="Delete your account" tint={theme.danger} onPress={confirmDelete} />
          </Card>
        </View>
        <Text className="mt-[10px] px-[26px] text-[13px] leading-[18px] text-[#A0A0A8] dark:text-[#7A7A80]">
          Deleting your account removes your profile and meal history for good.
        </Text>
      </ScrollView>
    </View>
  )
}