import { Tabs } from 'expo-router/js-tabs';
import { BarChart3, BookOpen, Brain, Sun, UserRound } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: colors.inkSoft,
                tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
                tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 2 },
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
                name="progress"
                options={{ title: 'Tiến độ', tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }}
            />
            <Tabs.Screen
                name="methods"
                options={{ title: 'Phương pháp', tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }}
            />
            <Tabs.Screen
                name="profile"
                options={{ title: 'Hồ sơ', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }}
            />
        </Tabs>
    );
}
