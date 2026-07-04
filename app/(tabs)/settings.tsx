import { Colors } from '@/constants/Colors';
import { ThemeContext } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ChevronRight, ExternalLink, FileText, Github, Info, Moon, Shield, Smartphone, Sun, Trash2, User } from 'lucide-react-native';
import { useContext } from 'react';
import { Alert, Animated, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const handleHaptic = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
};

const SettingItem = ({ icon: Icon, label, onPress, destructive = false, value = '', link = false, description, theme }: any) => (
    <Pressable
        style={({ pressed }) => [
            styles.item,
            {
                backgroundColor: theme.secondaryBackground,
                transform: [{ scale: pressed ? 0.98 : 1 }]
            }
        ]}
        onPress={() => {
            handleHaptic();
            onPress();
        }}
    >
        <View style={styles.itemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: destructive ? 'rgba(255, 68, 68, 0.1)' : theme.background }]}>
                <Icon size={22} color={destructive ? '#ff4444' : theme.tint} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: destructive ? '#ff4444' : theme.text }]}>{label}</Text>
                {description && <Text style={[styles.itemDescription, { color: theme.icon }]}>{description}</Text>}
            </View>
        </View>
        <View style={styles.itemRight}>
            {value ? <Text style={[styles.valueText, { color: theme.icon }]}>{value}</Text> : null}
            {!destructive && (link ? <ExternalLink size={16} color={theme.icon} /> : <ChevronRight size={20} color={theme.icon} style={{ opacity: 0.5 }} />)}
        </View>
    </Pressable>
);

export default function SettingsScreen() {
    const colorScheme = useColorScheme();
    const { toggleTheme } = useContext(ThemeContext);
    const theme = Colors[colorScheme ?? 'light'];

    // Animation for the header
    const scrollY = new Animated.Value(0);

    const clearAllData = async () => {
        handleHaptic();
        Alert.alert(
            "Clear All Data",
            "Are you sure you want to delete all Todos, Notes, and Calendar Events? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => { }
                },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            await AsyncStorage.multiRemove(['@todo_list', '@notes_list', '@calendar_events']);
                            if (Platform.OS !== 'web') {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                            Alert.alert('Success', 'All data has been cleared.');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to clear data.');
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const openLink = async (url: string) => {
        handleHaptic();
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', `Don't know how to open this URL: ${url}`);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to open link');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
            >
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionHeader, { color: theme.tint }]}>Preference</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBackground }]}>
                        <SettingItem
                            icon={colorScheme === 'dark' ? Moon : Sun}
                            label="Appearance"
                            description={colorScheme === 'dark' ? 'Dark Mode On' : 'Light Mode On'}
                            value={colorScheme === 'dark' ? 'Dark' : 'Light'}
                            onPress={toggleTheme}
                            theme={theme}
                        />
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionHeader, { color: theme.tint }]}>Data</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBackground }]}>
                        <SettingItem
                            icon={Trash2}
                            label="Clear Storage"
                            description="Delete all Todos, Notes & Events"
                            destructive
                            onPress={clearAllData}
                            theme={theme}
                        />
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionHeader, { color: theme.tint }]}>Legal</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBackground }]}>
                        <SettingItem
                            icon={Shield}
                            label="Privacy Policy"
                            link
                            onPress={() => openLink('https://policies.google.com/privacy')}
                            theme={theme}
                        />
                        <View style={[styles.separator, { backgroundColor: theme.border }]} />
                        <SettingItem
                            icon={FileText}
                            label="Terms of Service"
                            link
                            onPress={() => openLink('https://policies.google.com/terms')}
                            theme={theme}
                        />
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionHeader, { color: theme.tint }]}>About</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBackground }]}>
                        <SettingItem
                            icon={Info}
                            label="Version"
                            value="1.2.0"
                            onPress={() => { }}
                            theme={theme}
                        />
                        <View style={[styles.separator, { backgroundColor: theme.border }]} />
                        <SettingItem
                            icon={Smartphone}
                            label="Device"
                            value={Platform.OS.toUpperCase()}
                            onPress={() => { }}
                            theme={theme}
                        />
                        <View style={[styles.separator, { backgroundColor: theme.border }]} />
                        <SettingItem
                            icon={User}
                            label="Developer"
                            value="sugenthar M"
                            onPress={() => { }}
                            theme={theme}
                        />
                        <View style={[styles.separator, { backgroundColor: theme.border }]} />
                        <SettingItem
                            icon={Github}
                            label="Source Code"
                            link
                            onPress={() => openLink('https://github.com/sugenthar/Calculator')}
                            theme={theme}
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.icon }]}>Designed with precision</Text>
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 35,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    headerIcon: {
        padding: 10,
        borderRadius: 20,
    },
    sectionContainer: {
        marginBottom: 25,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.8,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    itemDescription: {
        fontSize: 12,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    valueText: {
        fontSize: 15,
        marginRight: 8,
        fontWeight: '500',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 70, // Align with text start
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        opacity: 0.5,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '500',
    }
});
