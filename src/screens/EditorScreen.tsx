import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SRTProject, SubtitleBlock } from '../types';
import { saveProject } from '../storage/db';
import { SubtitleBlockComponent } from '../components/SubtitleBlock';
import { TranscriptView } from '../components/TranscriptView';
import { ExportModal } from '../components/ExportModal';
import { StyleLoadingOverlay } from '../components/StyleLoadingOverlay';
import { buildSRT } from '../utils/srtBuilder';
import { parseSRT } from '../utils/srtParser';
import { isOnline } from '../utils/networkCheck';

// Replace YOUR_LOCAL_IP with your machine's local network IP (e.g. 192.168.1.10)
const BACKEND_URL = 'http://192.168.1.10:8000';

export const EditorScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const route = useRoute<any>();
  const navigation = useNavigation();
  
  const initialProject = route.params?.project as SRTProject;
  const [project, setProject] = useState<SRTProject>(initialProject);
  const [view, setView] = useState<'srt' | 'transcript'>('srt');
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [undoSnapshot, setUndoSnapshot] = useState<SubtitleBlock[] | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

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
      Alert.alert(
        'Save before leaving?',
        'You have unsaved changes.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { 
            text: 'Exit Without Saving', 
            style: 'destructive', 
            onPress: () => navigation.dispatch(e.data.action) 
          },
          { 
            text: 'Save & Exit', 
            onPress: async () => {
              await saveProjectToSQLite(project);
              navigation.dispatch(e.data.action);
            } 
          },
        ]
      );
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
    setProject({ ...project, blocks: newBlocks });
    setIsUnsaved(true);
  };

  const handleUpdateBlock = (updatedBlock: SubtitleBlock) => {
    const newBlocks = project.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    updateBlocks(newBlocks);
  };

  const handleDeleteBlock = (id: number) => {
    Alert.alert('Delete', 'Delete this subtitle?', [
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
    ]);
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

  const callAIEndpoint = async (endpoint: string, message: string) => {
    const online = await isOnline();
    if (!online) {
      Alert.alert('Error', 'Internet required for AI features.');
      return;
    }

    setAiMessage(message);
    setAiLoading(true);

    try {
      const srtString = buildSRT(project.blocks);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srt: srtString }),
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

      setUndoSnapshot([...project.blocks]);
      updateBlocks(newBlocks);
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 5000);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        Alert.alert('Error', 'Request timed out. Please try again.');
      } else {
        Alert.alert('Error', error.message || 'Processing failed. Original content preserved.');
      }
    } finally {
      setAiLoading(false);
    }
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

        <TouchableOpacity onPress={() => setShowExport(true)} style={styles.iconBtn}>
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity 
          style={[styles.toggleBtn, view === 'srt' && styles.toggleActive]}
          onPress={() => setView('srt')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, view === 'srt' && styles.toggleTextActive]}>SRT View</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, view === 'transcript' && styles.toggleActive]}
          onPress={() => setView('transcript')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, view === 'transcript' && styles.toggleTextActive]}>Transcript View</Text>
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
        ) : (
          <TranscriptView blocks={project.blocks} onUpdateBlocks={updateBlocks} />
        )}
      </View>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderTopColor: isDark ? '#333' : '#E0E0E0' }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => callAIEndpoint('/style-srt', 'Styling subtitles...')} activeOpacity={0.75}>
          <Text style={styles.actionBtnText}>🎨 Style</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => callAIEndpoint('/convert-hinglish', 'Converting to Hinglish...')} activeOpacity={0.75}>
          <Text style={styles.actionBtnText}>🔤 Hinglish</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleAddBlock} activeOpacity={0.75}>
          <Text style={styles.actionBtnText}>+ Add Block</Text>
        </TouchableOpacity>
      </View>

      {/* Undo Toast */}
      {showUndo && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>AI changes applied.</Text>
          <TouchableOpacity onPress={() => {
            if (undoSnapshot) {
              updateBlocks(undoSnapshot);
              setShowUndo(false);
            }
          }}>
            <Text style={styles.undoText}>[Undo]</Text>
          </TouchableOpacity>
        </View>
      )}

      <ExportModal
        visible={showExport}
        projectName={project.projectName}
        blocks={project.blocks}
        onClose={() => setShowExport(false)}
      />
      <StyleLoadingOverlay visible={aiLoading} message={aiMessage} />
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
  exportText: { fontSize: 16, color: '#5C35C8', fontWeight: 'bold' },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  toggleBtn: { flex: 1, padding: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: '#5C35C8' },
  toggleText: { color: '#666', fontWeight: 'bold' },
  toggleTextActive: { color: '#FFF' },
  content: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#121212',
  },
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  toastText: { color: '#FFF', fontSize: 14 },
  undoText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 14 },
});
