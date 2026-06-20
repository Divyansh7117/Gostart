import React from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useApp } from '../context/AppContext';
import type {
  RootStackParamList,
  FindMatchStackParamList,
  MessagesStackParamList,
  ProfileStackParamList,
  MainTabParamList,
} from '../types';

import FindMatchScreen from '../screens/FindMatchScreen';
import SearchingScreen from '../screens/SearchingScreen';
import NoMatchScreen from '../screens/NoMatchScreen';
import MatchRevealedScreen from '../screens/MatchRevealedScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import MatchProfileScreen from '../screens/MatchProfileScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BuyCreditsScreen from '../screens/BuyCreditsScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MatchesCarouselScreen from '../screens/MatchesCarouselScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import TermsScreen from '../screens/TermsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const RootStack = createStackNavigator<RootStackParamList>();
const FindMatchStack = createStackNavigator<FindMatchStackParamList>();
const MessagesStack = createStackNavigator<MessagesStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const GoStartTheme = {
  dark: true,
  colors: {
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.navBackground,
    text: COLORS.textPrimary,
    border: COLORS.cardBorder,
    notification: COLORS.primary,
  },
  fonts: {
    regular: { fontFamily: 'Outfit_400Regular', fontWeight: '400' as const },
    medium:  { fontFamily: 'Outfit_500Medium',  fontWeight: '500' as const },
    bold:    { fontFamily: 'Outfit_700Bold',    fontWeight: '700' as const },
    heavy:   { fontFamily: 'Outfit_700Bold',    fontWeight: '900' as const },
  },
};

// ── Stack navigators ───────────────────────────────────────────────────────────

const FindMatchNavigator = () => (
  <FindMatchStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.background } }}>
    <FindMatchStack.Screen name="FindMatch" component={FindMatchScreen} />
    <FindMatchStack.Screen name="Searching" component={SearchingScreen} />
    <FindMatchStack.Screen name="NoMatch" component={NoMatchScreen} />
    <FindMatchStack.Screen name="MatchRevealed" component={MatchRevealedScreen} />
    <FindMatchStack.Screen name="BuyCredits" component={BuyCreditsScreen} />
  </FindMatchStack.Navigator>
);

const MessagesNavigator = () => (
  <MessagesStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.background } }}>
    <MessagesStack.Screen name="MessagesList" component={MessagesScreen} />
    <MessagesStack.Screen name="MatchesCarousel" component={MatchesCarouselScreen} />
    <MessagesStack.Screen name="Chat" component={ChatScreen} />
    <MessagesStack.Screen name="MatchProfile" component={MatchProfileScreen} />
  </MessagesStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.background } }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="BuyCreditsProfile" component={BuyCreditsScreen} />
    <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    <ProfileStack.Screen name="Privacy" component={PrivacyScreen} />
    <ProfileStack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <ProfileStack.Screen name="Terms" component={TermsScreen} />
  </ProfileStack.Navigator>
);

// ── Custom tab bar ─────────────────────────────────────────────────────────────
// Matches the Figma spec exactly:
//   • Floating dark pill (rgba 22,22,22 / 0.8) with glass overlay
//   • Find Match tab always elevated with logomark circle (rgba 113,0,20 / 0.6)
//   • Other tabs: 24px Ionicons, label color #767676 inactive / #F2F1ED active

type TabConfig = {
  name: keyof MainTabParamList;
  label: string;
  icon: ReturnType<typeof require>;
};

const TABS: TabConfig[] = [
  { name: 'FindMatchTab',  label: 'Find Match', icon: require('../../assets/icons/home.png') },
  { name: 'MessagesTab',  label: 'Messages',   icon: require('../../assets/icons/messages.png') },
  { name: 'CommunityTab', label: 'Community',  icon: require('../../assets/icons/community.png') },
  { name: 'ProfileTab',   label: 'Profile',    icon: require('../../assets/icons/profile.png') },
];

// Total container = 15px top gap + 84px pill
const PILL_TOP   = 15;
const PILL_HEIGHT = 84;
const CONTAINER_HEIGHT = PILL_TOP + PILL_HEIGHT;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom;

  return (
    <View style={[styles.tabBarContainer, { height: CONTAINER_HEIGHT + bottomPad }]}>
      {/* Floating pill — dark frosted glass */}
      <View style={[styles.pill, { bottom: bottomPad }]}>
        <View style={styles.pillOverlay} />
      </View>

      {/* Tab items row — aligned to pill baseline */}
      <View style={[styles.menu, { bottom: bottomPad }]}>
        {TABS.map((tab, index) => {
          const focused = state.index === index;
          const isFindMatch = tab.name === 'FindMatchTab';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[index].key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          if (isFindMatch) {
            // Always-elevated primary tab — sits above the pill
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.findMatchItem}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <View style={styles.findMatchCircle}>
                  <View style={styles.findMatchHighlight} />
                  <Image
                    source={require('../../assets/icons/Logomark.png')}
                    style={styles.logomarkIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.findMatchLabel}>{tab.label}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Image
                source={tab.icon}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.45, tintColor: focused ? '#F2F1ED' : undefined }]}
                resizeMode="contain"
              />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {focused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Main tab navigator ─────────────────────────────────────────────────────────

const MainTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="FindMatchTab"  component={FindMatchNavigator} />
    <Tab.Screen name="MessagesTab"   component={MessagesNavigator} />
    <Tab.Screen name="CommunityTab"  component={CommunityScreen} />
    <Tab.Screen name="ProfileTab"    component={ProfileNavigator} />
  </Tab.Navigator>
);

// ── Root navigator ─────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { isLoggedIn, isLoading, needsOnboarding } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={GoStartTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.background } }}>
        {!isLoggedIn
          ? <RootStack.Screen name="Login" component={LoginScreen} />
          : needsOnboarding
            ? <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            : <RootStack.Screen name="Main" component={MainTabNavigator} />
        }
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Outer container — positioned absolutely at the bottom
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CONTAINER_HEIGHT,
  },

  // The floating dark pill (84px tall, starts 15px from top of container)
  pill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PILL_TOP,
    height: PILL_HEIGHT,
    backgroundColor: 'rgba(22, 22, 22, 0.8)',
    borderRadius: 26,
    overflow: 'hidden',
  },

  // White glass overlay on top of the pill
  pillOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Row of 4 tab items, aligned to bottom of pill
  menu: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: PILL_TOP,
    height: PILL_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  // ── Find Match (primary elevated tab) ───────────────────────────────────────
  findMatchItem: {
    width: 78,
    height: 86.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 12.5,
    gap: 4,
  },
  findMatchCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#710014',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.25)',
    shadowColor: '#7B0D1E',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    shadowOpacity: 0.85,
    elevation: 14,
  },
  findMatchHighlight: {
    position: 'absolute',
    top: 3,
    left: 5,
    right: 5,
    height: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  logomarkIcon: {
    width: 28,
    height: 28,
    tintColor: '#F2F1ED',
  },
  findMatchLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#F2F1ED',
    textAlign: 'center',
  },

  // ── Regular tabs ────────────────────────────────────────────────────────────
  tabItem: {
    width: 78,
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    paddingBottom: 12,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#767676',
  },
  tabLabelActive: {
    color: '#F2F1ED',
    fontFamily: 'Outfit_500Medium',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F2F1ED',
    marginTop: 2,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
