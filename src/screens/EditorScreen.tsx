import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, useColorScheme, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SRTProject, SubtitleBlock } from '../types';
import { saveProject } from '../storage/db';
import { SubtitleBlockComponent } from '../components/SubtitleBlock';
import { TranscriptView } from '../components/TranscriptView';
import { SRTTextView } from '../components/SRTTextView';
import { ExportModal } from '../components/ExportModal';
import { StyleLoadingOverlay } from '../components/StyleLoadingOverlay';
import { buildSRT } from '../utils/srtBuilder';
import { parseSRT } from '../utils/srtParser';
import { isOnline } from '../utils/networkCheck';
import { CustomAlert, CustomAlertConfig } from '../components/CustomAlert';

const BACKEND_URL = 'https://srt-file.onrender.com';

const LANGUAGES = [
  { label: 'Hinglish', value: 'Hinglish' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' },
  { label: 'Portuguese', value: 'Portuguese' },
  { label: 'Italian', value: 'Italian' },
  { label: 'Turkish', value: 'Turkish' },
  { label: 'Japanese (Romaji)', value: 'Japanese Romaji' },
  { label: 'Korean (Romanized)', value: 'Korean Romanized' },
  { label: 'Arabic (Romanized)', value: 'Arabic Romanized' },
  { label: 'Russian (Romanized)', value: 'Russian Romanized' },
  { label: 'Chinese (Pinyin)', value: 'Chinese Pinyin' },
];

export const EditorScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const route = useRoute<any>();
  const navigation = useNavigation();

  const initialProject = route.params?.project as SRTProject;
  const [project, setProject] = useState<SRTProject>(initialProject);
  const [view, setView] = useState<'srt' | 'transcript' | 'text'>('srt');
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [alertConfig, setAlertConfig] = useState<CustomAlertConfig | null>(null);

  // Undo / Redo history
  const [past, setPast] = useState<SubtitleBlock[][]>([]);
  const [future, setFuture] = useState<SubtitleBlock[][]>([]);
  const skipHistory = useRef(false);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveProjectToSQLite(project);
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    }, 30000);
    return () => clearInterval(interval);
  }, [project]);

  // Handle Back Button & Unsaved Changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isUnsaved) return;

      e.preventDefault();
      setAlertConfig({
        title: 'Leave editor?',
        message: 'Your changes are saved automatically.',
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: () => { } },
          {
            text: 'OK',
            onPress: async () => {
              await saveProjectToSQLite(project);
              navigation.dispatch(e.data.action);
            }
          },
        ]
      });
    });
    return unsubscribe;
  }, [navigation, isUnsaved, project]);

  const saveProjectToSQLite = async (proj: SRTProject) => {
    const updated = { ...proj, updatedAt: Date.now() };
    await saveProject(updated);
    setProject(updated);
    setIsUnsaved(false);
  };

  const updateBlocks = (newBlocks: SubtitleBlock[]) => {
    if (!skipHistory.current) {
      setPast(prev => [...prev, project.blocks]);
      setFuture([]);
    }
    skipHistory.current = false;
    setProject({ ...project, blocks: newBlocks });
    setIsUnsaved(true);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(prev => prev.slice(0, -1));
    setFuture(prev => [project.blocks, ...prev]);
    skipHistory.current = true;
    setProject({ ...project, blocks: previous });
    setIsUnsaved(true);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(prev => prev.slice(1));
    setPast(prev => [...prev, project.blocks]);
    skipHistory.current = true;
    setProject({ ...project, blocks: next });
    setIsUnsaved(true);
  };

  const handleUpdateBlock = (updatedBlock: SubtitleBlock) => {
    const newBlocks = project.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    updateBlocks(newBlocks);
  };

  const handleDeleteBlock = (id: number) => {
    setAlertConfig({
      title: 'Delete',
      message: 'Delete this subtitle?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            const filtered = project.blocks.filter(b => b.id !== id);
            const renumbered = filtered.map((b, i) => ({ ...b, id: i + 1 }));
            updateBlocks(renumbered);
          }
        }
      ]
    });
  };

  const handleAddBlock = () => {
    const lastBlock = project.blocks[project.blocks.length - 1];
    const newBlock: SubtitleBlock = {
      id: project.blocks.length + 1,
      startTime: lastBlock ? lastBlock.endTime : "00:00:00,000",
      endTime: lastBlock ? lastBlock.endTime : "00:00:02,000",
      text: ""
    };
    updateBlocks([...project.blocks, newBlock]);
  };

  const callAIEndpoint = async (endpoint: string, message: string, body?: any) => {
    const online = await isOnline();
    if (!online) {
      setAlertConfig({ title: 'Error', message: 'Internet required for AI features.' });
      return;
    }

    setAiMessage(message);
    setAiLoading(true);

    try {
      const srtString = buildSRT(project.blocks);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const requestBody = body ? { srt: srtString, ...body } : { srt: srtString };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Processing failed. Original content preserved.');
      }

      const newSrtString = await response.text();
      const newBlocks = parseSRT(newSrtString);

      if (newBlocks.length === 0) {
        throw new Error('Processing failed. Original content preserved.');
      }

      updateBlocks(newBlocks);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setAlertConfig({ title: 'Error', message: 'Request timed out. Please try again.' });
      } else {
        setAlertConfig({ title: 'Error', message: error.message || 'Processing failed. Original content preserved.' });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleLanguageSelect = (language: string) => {
    setShowLanguagePicker(false);
    callAIEndpoint('/convert-language', `Converting to ${language}...`, { language });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={28} color={isDark ? '#FFF' : '#121212'} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <TextInput
            style={[styles.projectNameInput, { color: isDark ? '#FFF' : '#121212' }]}
            value={project.projectName}
            onChangeText={(text) => {
              setProject({ ...project, projectName: text });
              setIsUnsaved(true);
            }}
            onBlur={() => saveProjectToSQLite(project)}
          />
          {savedIndicator && <Text style={styles.savedText}>Saved ✓</Text>}
          {isUnsaved && !savedIndicator && <Text style={styles.unsavedText}>Unsaved changes</Text>}
        </View>

        <TouchableOpacity onPress={() => setShowExport(true)} style={styles.exportBtn}>
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={[styles.toggleRow, { backgroundColor: isDark ? '#1E1E1E' : '#E8E8E8' }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'srt' && styles.toggleActive]}
          onPress={() => setView('srt')}
          activeOpacity={0.8}
        >
          {view === 'srt' ? (
            <Text style={styles.toggleTextActive}>SRT</Text>
          ) : (
            <Ionicons name="chatbox-ellipses-outline" size={20} color={isDark ? '#888' : '#666'} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'transcript' && styles.toggleActive]}
          onPress={() => setView('transcript')}
          activeOpacity={0.8}
        >
          {view === 'transcript' ? (
            <Text style={styles.toggleTextActive}>Transcript</Text>
          ) : (
            <Ionicons name="document-text-outline" size={20} color={isDark ? '#888' : '#666'} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'text' && styles.toggleActive]}
          onPress={() => setView('text')}
          activeOpacity={0.8}
        >
          {view === 'text' ? (
            <Text style={styles.toggleTextActive}>Text</Text>
          ) : (
            <Ionicons name="text-outline" size={20} color={isDark ? '#888' : '#666'} />
          )}
        </TouchableOpacity>
      </View>

      {/* Undo / Redo Row */}
      <View style={styles.undoRedoRow}>
        <TouchableOpacity
          style={styles.smallIconButton}
          onPress={handleUndo}
          activeOpacity={0.7}
          disabled={past.length === 0}
        >
          <Ionicons name="arrow-undo-outline" size={20} color={past.length > 0 ? (isDark ? '#FFF' : '#121212') : (isDark ? '#555' : '#CCC')} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallIconButton}
          onPress={handleRedo}
          activeOpacity={0.7}
          disabled={future.length === 0}
        >
          <Ionicons name="arrow-redo-outline" size={20} color={future.length > 0 ? (isDark ? '#FFF' : '#121212') : (isDark ? '#555' : '#CCC')} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {view === 'srt' ? (
          <FlatList
            data={project.blocks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <SubtitleBlockComponent
                block={item}
                index={index}
                onUpdate={handleUpdateBlock}
                onDelete={() => handleDeleteBlock(item.id)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : view === 'transcript' ? (
          <TranscriptView blocks={project.blocks} onUpdateBlocks={updateBlocks} />
        ) : (
          <SRTTextView blocks={project.blocks} onUpdateBlocks={updateBlocks} />
        )}
      </View>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderTopColor: isDark ? '#333' : '#E0E0E0' }]}>
        {/* Style */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => callAIEndpoint('/style-srt', 'Styling subtitles...')} activeOpacity={0.75}>
          <Ionicons name="sparkles" size={22} color="#5C35C8" />
          <Text style={styles.actionBtnLabel}>Style</Text>
        </TouchableOpacity>

        {/* Language */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowLanguagePicker(true)} activeOpacity={0.75}>
          <Ionicons name="globe-outline" size={22} color="#5C35C8" />
          <Text style={styles.actionBtnLabel}>Language</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Add Button (FAB) */}
      <TouchableOpacity style={styles.fab} onPress={handleAddBlock} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguagePicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#121212' }]}>Select Language</Text>
            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={[styles.languageItem, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}
                  onPress={() => handleLanguageSelect(lang.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.languageText, { color: isDark ? '#FFF' : '#121212' }]}>{lang.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={isDark ? '#666' : '#CCC'} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <ExportModal
        visible={showExport}
        projectName={project.projectName}
        blocks={project.blocks}
        onClose={() => setShowExport(false)}
      />
      <StyleLoadingOverlay visible={aiLoading} message={aiMessage} />
      <CustomAlert visible={!!alertConfig} config={alertConfig} onClose={() => setAlertConfig(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: { padding: 8 },
  exportBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  exportText: {
    color: '#5C35C8',
    fontSize: 15,
    fontWeight: 'bold',
  },
  titleContainer: { flex: 1, alignItems: 'center' },
  projectNameInput: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 4,
    minWidth: 150,
  },
  savedText: { fontSize: 12, color: '#4CAF50', marginTop: 2 },
  unsavedText: { fontSize: 12, color: '#FF9800', marginTop: 2 },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: '#5C35C8',
  },
  toggleTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  undoRedoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 16,
  },
  smallIconButton: {
    padding: 6,
  },
  content: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    backgroundColor: '#1A1A2E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#5C35C8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.35,
    borderColor: '#555',
  },
  actionBtnLabel: {
    color: '#5C35C8',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5C35C8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  languageList: {
    flexGrow: 0,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  languageText: {
    fontSize: 16,
  },
});
