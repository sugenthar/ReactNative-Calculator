import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { documentDirectory, EncodingType, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Plus, Search, Share2, StickyNote, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Note {
    id: string;
    title: string;
    content: string;
    date: string;
}

export default function NotesScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [notes, setNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [currentNote, setCurrentNote] = useState<Note | null>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        loadNotes();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredNotes(notes);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = notes.filter(
                note =>
                    note.title.toLowerCase().includes(lowerQuery) ||
                    note.content.toLowerCase().includes(lowerQuery)
            );
            setFilteredNotes(filtered);
        }
    }, [searchQuery, notes]);

    const loadNotes = async () => {
        try {
            const storedNotes = await AsyncStorage.getItem('@notes_list');
            if (storedNotes) {
                const parsed = JSON.parse(storedNotes);
                setNotes(parsed);
                setFilteredNotes(parsed);
            }
        } catch (e) {
            console.error('Failed to load notes');
        }
    };

    const saveNotes = async (newNotes: Note[]) => {
        try {
            await AsyncStorage.setItem('@notes_list', JSON.stringify(newNotes));
            setNotes(newNotes);
        } catch (e) {
            console.error('Failed to save notes');
        }
    };

    const openModal = (note?: Note) => {
        if (note) {
            setCurrentNote(note);
            setTitle(note.title);
            setContent(note.content);
        } else {
            setCurrentNote(null);
            setTitle('');
            setContent('');
        }
        setModalVisible(true);
    };

    const handleSave = () => {
        if (title.trim() === '' && content.trim() === '') {
            setModalVisible(false);
            return;
        }

        const date = new Date().toLocaleDateString();

        if (currentNote) {
            // Edit existing
            const updatedNotes = notes.map(n =>
                n.id === currentNote.id ? { ...n, title, content, date } : n
            );
            saveNotes(updatedNotes);
        } else {
            // Add new
            const newNote: Note = {
                id: Date.now().toString(),
                title: title || 'Untitled',
                content,
                date,
            };
            saveNotes([newNote, ...notes]);
        }
        setModalVisible(false);
    };

    const deleteNote = (id: string) => {
        const newNotes = notes.filter(n => n.id !== id);
        saveNotes(newNotes);
        if (currentNote?.id === id) setModalVisible(false);
    };

    const shareNote = async () => {
        if (!title && !content) return;

        try {
            const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${title || 'Note'}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333; }
                        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
                        .date { color: #888; font-size: 14px; margin-bottom: 20px; }
                        .content { line-height: 1.6; white-space: pre-wrap; font-size: 16px; }
                        .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #aaa; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <h1>${title || 'Untitled Note'}</h1>
                    <div class="date">Created: ${new Date().toLocaleDateString()}</div>
                    <div class="content">${content}</div>
                    <div class="footer">Generated by My App</div>
                </body>
            </html>
            `;

            const cleanTitle = (title || 'note').replace(/[^a-zA-Z0-9]/g, '_');
            const fileUri = documentDirectory + `note_${cleanTitle}.html`;
            await writeAsStringAsync(fileUri, htmlContent, { encoding: EncodingType.UTF8 });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                alert('Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Error sharing note:', error);
        }
    };

    const renderItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.secondaryBackground }]}
            onPress={() => openModal(item)}
        >
            <View style={styles.cardHeader}>
                <StickyNote size={18} color={theme.tint} style={{ marginRight: 8 }} />
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
            </View>
            <Text style={[styles.cardContent, { color: theme.icon }]} numberOfLines={3}>{item.content}</Text>
            <Text style={[styles.cardDate, { color: theme.icon }]}>{item.date}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Notes</Text>
                <TouchableOpacity onPress={() => openModal()} style={[styles.addButton, { backgroundColor: theme.tint }]}>
                    <Plus size={24} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.secondaryBackground }]}>
                <Search size={20} color={theme.icon} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search notes..."
                    placeholderTextColor={theme.icon}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <X size={16} color={theme.icon} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filteredNotes}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: theme.icon }}>
                            {searchQuery ? 'No filtered notes found' : 'No notes yet'}
                        </Text>
                    </View>
                }
            />

            <Modal
                animationType="slide"
                presentationStyle="pageSheet"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={{ color: theme.tint, fontSize: 17 }}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{currentNote ? 'Edit Note' : 'New Note'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            {currentNote && (
                                <TouchableOpacity onPress={shareNote}>
                                    <Share2 size={22} color={theme.tint} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={handleSave}>
                                <Text style={{ color: theme.tint, fontSize: 17, fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.titleInput, { color: theme.text }]}
                            placeholder="Title"
                            placeholderTextColor={theme.icon}
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            style={[styles.contentInput, { color: theme.text }]}
                            placeholder="Start typing..."
                            placeholderTextColor={theme.icon}
                            multiline
                            value={content}
                            onChangeText={setContent}
                            textAlignVertical="top"
                        />
                    </View>

                    {currentNote && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => deleteNote(currentNote.id)}
                        >
                            <Trash2 size={24} color="#ff4444" />
                            <Text style={{ color: '#ff4444', marginLeft: 8, fontSize: 17 }}>Delete Note</Text>
                        </TouchableOpacity>
                    )}
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
        paddingHorizontal: 20,
        marginBottom: 10,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 10,
        borderRadius: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    card: {
        width: '48%',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        height: 160,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        flex: 1,
    },
    cardContent: {
        fontSize: 14,
        flex: 1,
    },
    cardDate: {
        fontSize: 12,
        marginTop: 8,
        opacity: 0.7,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
        width: '100%',
    },
    modalContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 20 : 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    inputContainer: {
        flex: 1,
        padding: 20,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    contentInput: {
        fontSize: 18,
        flex: 1,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        paddingBottom: 40,
    }
});
