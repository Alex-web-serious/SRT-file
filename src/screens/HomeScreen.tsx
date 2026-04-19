import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllProjects, deleteProject, saveProject } from '../storage/db';
import { SRTProject } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert, CustomAlertConfig } from '../components/CustomAlert';
import { DraftOptionsMenu } from '../components/DraftOptionsMenu';

type RootStackParamList = {
  Home: undefined;
  AudioToSRT: undefined;
  ManualEditorHome: undefined;
  Editor: { project: SRTProject };
  Settings: undefined;
};

export const HomeScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [projects, setProjects] = useState<SRTProject[]>([]);
  const [alertConfig, setAlertConfig] = useState<CustomAlertConfig | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<SRTProject | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    const data = await getAllProjects();
    setProjects(data);
  };

  const handleLongPress = (project: SRTProject) => {
    setSelectedDraft(project);
    setMenuVisible(true);
  };

  const handleOpenMenu = (project: SRTProject) => {
    setSelectedDraft(project);
    setMenuVisible(true);
  };

  const confirmDelete = (project: SRTProject) => {
    setAlertConfig({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${project.projectName}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteProject(project.projectId);
            loadProjects();
          }
        }
      ]
    });
  };

  const handleRename = (project: SRTProject) => {
    setAlertConfig({
      title: 'Rename Project',
      isPrompt: true,
      defaultValue: project.projectName,
      placeholder: 'Enter new name',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (newName?: string) => {
            if (newName && newName.trim()) {
              const updated = { ...project, projectName: newName.trim(), updatedAt: Date.now() };
              await saveProject(updated);
              loadProjects();
            }
          }
        }
      ]
    });
  };

  const renderProject = ({ item }: { item: SRTProject }) => {
    const date = new Date(item.updatedAt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    const preview = item.blocks.slice(0, 2).map(b => b.text).join(' ').substring(0, 40);

    return (
      <TouchableOpacity 
        style={[styles.draftCard, { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5', borderColor: isDark ? '#333' : '#E0E0E0' }]}
        onPress={() => navigation.navigate('Editor', { project: item })}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.draftLeftAccent} />
        <View style={styles.draftContent}>
          <View style={styles.draftCardHeader}>
            <Text style={[styles.draftTitle, { color: isDark ? '#FFF' : '#121212' }]} numberOfLines={1}>{item.projectName}</Text>
            <TouchableOpacity onPress={() => handleOpenMenu(item)} style={styles.menuIconContainer}>
              <Ionicons name="ellipsis-vertical" size={20} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
          </View>
          <Text style={styles.draftMeta}>
            {date}
            {preview ? <Text style={styles.draftPreview}> · {preview}...</Text> : null}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: isDark ? '#FFF' : '#121212' }]}>Subtitle Studio</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={isDark ? '#888' : '#666'} />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>AI-powered subtitle tools</Text>

      {/* Audio to SRT Card */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#F8F8FF' }]} 
        onPress={() => navigation.navigate('AudioToSRT')}
        activeOpacity={0.75}
      >
        <View style={styles.cardIconWrap}>
          <Ionicons name="mic-outline" size={30} color="#5C35C8" />
          <Ionicons name="pulse-outline" size={22} color="#7B5EE0" style={styles.cardIconOverlay} />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#121212' }]}>Audio to SRT</Text>
          <Text style={[styles.cardDesc, { color: isDark ? '#999' : '#666' }]}>Generate subtitles from audio using AI</Text>
        </View>
      </TouchableOpacity>

      {/* SRT Manual Editor Card */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#F8F8FF' }]} 
        onPress={() => navigation.navigate('ManualEditorHome')}
        activeOpacity={0.75}
      >
        <View style={styles.cardIconWrap}>
          <Ionicons name="create-outline" size={30} color="#5C35C8" />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#121212' }]}>SRT Manual Editor</Text>
          <Text style={[styles.cardDesc, { color: isDark ? '#999' : '#666' }]}>Create or edit subtitle files offline</Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#121212' }]}>Saved Drafts</Text>
      
      {projects.length === 0 ? (
        <Text style={styles.emptyText}>No saved projects yet</Text>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={item => item.projectId}
          renderItem={renderProject}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <DraftOptionsMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onRename={() => {
          if (selectedDraft) handleRename(selectedDraft);
        }}
        onDelete={() => {
          if (selectedDraft) confirmDelete(selectedDraft);
        }}
      />
      <CustomAlert 
        visible={!!alertConfig} 
        config={alertConfig} 
        onClose={() => setAlertConfig(null)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingsBtn: {
    padding: 8,
  },
  title: { fontSize: 30, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },

  // Feature Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#5C35C8',
    elevation: 3,
    shadowColor: '#5C35C8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(92, 53, 200, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIconOverlay: {
    position: 'absolute',
    right: 4,
    bottom: 6,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { fontSize: 14, lineHeight: 20 },

  // Section
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 28, marginBottom: 16 },

  // Draft Cards
  draftCard: {
    flexDirection: 'row',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 1,
  },
  draftLeftAccent: {
    width: 4,
    backgroundColor: '#5C35C8',
  },
  draftContent: {
    flex: 1,
    padding: 14,
    paddingLeft: 14,
  },
  draftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  menuIconContainer: {
    padding: 4,
  },
  draftTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  draftMeta: { fontSize: 13, color: '#888' },
  draftPreview: { color: '#7B5EE0' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  list: { paddingBottom: 40 },
});
