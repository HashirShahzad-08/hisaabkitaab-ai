// Bottom tab bar from DESIGN.md section 7.
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import AddSheet from '../../components/AddSheet';
import AddTabButton from '../../components/AddTabButton';
import TabIcon from '../../components/TabIcon';
import { AddSheetProvider } from '../../context/AddSheetContext';
import { colors, fonts, sizes } from '../../theme';

function TabsInner() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isUrdu = i18n.language === 'ur';

  const icon = (name) => ({
    tabBarIcon: ({ focused }) => <TabIcon name={name} focused={focused} />,
  });

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: isUrdu ? fonts.ur.medium : fonts.en.medium,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: sizes.tabBar + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          overflow: 'visible', // lets the raised + button stick out above the bar
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), ...icon('home') }} />
      <Tabs.Screen name="history" options={{ title: t('tabs.history'), ...icon('list') }} />
      <Tabs.Screen
        name="add"
        options={{
          title: t('tabs.add'),
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <AddTabButton accessibilityLabel={t('tabs.add')} />
          ),
        }}
      />
      <Tabs.Screen name="bills" options={{ title: t('tabs.bills'), ...icon('flash') }} />
      <Tabs.Screen name="goals" options={{ title: t('tabs.goals'), ...icon('trophy') }} />
    </Tabs>
    <AddSheet />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <AddSheetProvider>
      <TabsInner />
    </AddSheetProvider>
  );
}
