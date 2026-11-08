import { Tabs } from 'expo-router/js-tabs';
import { Brain, Sun, UserRound } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: colors.inkSoft,
                tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
                tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.step },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{ title: 'Hôm nay', tabBarIcon: ({ color, size }) => <Sun color={color} size={size} /> }}
            />
            <Tabs.Screen
                name="games"
                options={{ title: 'Luyện tập', tabBarIcon: ({ color, size }) => <Brain color={color} size={size} /> }}
            />
            <Tabs.Screen
                name="profile"
                options={{ title: 'Hồ sơ', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }}
            />
        </Tabs>
    );
}
