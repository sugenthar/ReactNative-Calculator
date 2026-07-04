import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

interface Event {
    id: string;
    title: string;
    time: string;
}

interface EventsMap {
    [date: string]: Event[];
}

export default function CalendarScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [selectedDate, setSelectedDate] = useState('');
    const [events, setEvents] = useState<EventsMap>({});
    const [modalVisible, setModalVisible] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('');

    useEffect(() => {
        loadEvents();
        // Set today as default selected
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, []);

    const loadEvents = async () => {
        try {
            const storedEvents = await AsyncStorage.getItem('@calendar_events');
            if (storedEvents) {
                setEvents(JSON.parse(storedEvents));
            }
        } catch (e) {
            console.error('Failed to load events');
        }
    };

    const saveEvents = async (newEvents: EventsMap) => {
        try {
            await AsyncStorage.setItem('@calendar_events', JSON.stringify(newEvents));
            setEvents(newEvents);
        } catch (e) {
            console.error('Failed to save events');
        }
    };

    const addEvent = () => {
        if (!newEventTitle.trim() || !selectedDate) return;

        const newEvent: Event = {
            id: Date.now().toString(),
            title: newEventTitle,
            time: newEventTime || 'All Day',
        };

        const currentDateEvents = events[selectedDate] || [];
        const updatedEvents = {
            ...events,
            [selectedDate]: [...currentDateEvents, newEvent],
        };

        saveEvents(updatedEvents);
        setModalVisible(false);
        setNewEventTitle('');
        setNewEventTime('');
    };

    const deleteEvent = (eventId: string) => {
        if (!selectedDate) return;

        const currentDateEvents = events[selectedDate] || [];
        const updatedDateEvents = currentDateEvents.filter(e => e.id !== eventId);

        const updatedEvents = {
            ...events,
            [selectedDate]: updatedDateEvents,
        };

        saveEvents(updatedEvents);
    };

    const getMarkedDates = () => {
        const marked: any = {};

        // Mark dates with events
        Object.keys(events).forEach(date => {
            if (events[date].length > 0) {
                marked[date] = { marked: true, dotColor: theme.tint };
            }
        });

        // Mark selected date
        if (selectedDate) {
            marked[selectedDate] = {
                ...(marked[selectedDate] || {}),
                selected: true,
                selectedColor: theme.tint,
                selectedTextColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
            };
        }

        return marked;
    };

    const renderEvent = ({ item }: { item: Event }) => (
        <View style={[styles.eventCard, { backgroundColor: theme.secondaryBackground, borderColor: theme.border }]}>
            <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
                <View style={styles.eventMeta}>
                    <Clock size={14} color={theme.icon} style={{ marginRight: 4 }} />
                    <Text style={[styles.eventTime, { color: theme.icon }]}>{item.time}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => deleteEvent(item.id)} style={styles.deleteButton}>
                <Trash2 size={18} color="#ff4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Calendar</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.tint }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Plus size={24} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                </TouchableOpacity>
            </View>

            <View style={styles.calendarWrapper}>
                <Calendar
                    onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                    markedDates={getMarkedDates()}
                    theme={{
                        backgroundColor: theme.background,
                        calendarBackground: theme.background,
                        textSectionTitleColor: theme.icon,
                        selectedDayBackgroundColor: theme.tint,
                        selectedDayTextColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
                        todayTextColor: theme.tint,
                        dayTextColor: theme.text,
                        textDisabledColor: '#d9e1e8',
                        dotColor: theme.tint,
                        selectedDotColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
                        arrowColor: theme.tint,
                        monthTextColor: theme.text,
                        indicatorColor: theme.tint,
                        textDayFontWeight: '300',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '300',
                        textDayFontSize: 16,
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 14
                    }}
                />
            </View>

            <View style={[styles.eventsContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>
                    {selectedDate ? new Date(selectedDate).toDateString() : 'Select a date'}
                </Text>

                <FlatList
                    data={events[selectedDate] || []}
                    renderItem={renderEvent}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.eventsList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: theme.icon }}>No events for this day</Text>
                        </View>
                    }
                />
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={[styles.modalView, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>New Event</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.icon }]}>{selectedDate}</Text>

                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.secondaryBackground }]}
                            placeholder="Event Title"
                            placeholderTextColor={theme.icon}
                            value={newEventTitle}
                            onChangeText={setNewEventTitle}
                        />

                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.secondaryBackground }]}
                            placeholder="Time (e.g., 2:00 PM)"
                            placeholderTextColor={theme.icon}
                            value={newEventTime}
                            onChangeText={setNewEventTime}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose, { backgroundColor: theme.secondaryBackground }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: theme.tint }]}
                                onPress={addEvent}
                            >
                                <Text style={[styles.textStyle, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>Add Event</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 10,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarWrapper: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    eventsContainer: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    eventsList: {
        paddingBottom: 40,
    },
    eventCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    eventMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eventTime: {
        fontSize: 14,
    },
    deleteButton: {
        padding: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '85%',
        borderRadius: 20,
        padding: 25,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    input: {
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        borderRadius: 10,
        padding: 15,
        elevation: 2,
        width: '48%',
        alignItems: 'center',
    },
    buttonClose: {
        // 
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
