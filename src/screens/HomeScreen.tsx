import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllProjects, deleteProject } from '../storage/db';
import { SRTProject } from '../types';

type RootStackParamList = {
  Home: undefined;
  AudioToSRT: undefined;
  ManualEditorHome: undefined;
  Editor: { project: SRTProject };
};

export const HomeScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [projects, setProjects] = useState<SRTProject[]>([]);

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
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.projectName}"?`,
      [
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
    );
  };

  const renderProject = ({ item }: { item: SRTProject }) => {
    const date = new Date(item.updatedAt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    const preview = item.blocks.slice(0, 2).map(b => b.text).join(' ').substring(0, 60) + '...';

    return (
      <TouchableOpacity 
        style={[styles.draftCard, { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5' }]}
        onPress={() => navigation.navigate('Editor', { project: item })}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.75}
      >
        <Text style={[styles.draftTitle, { color: isDark ? '#FFF' : '#121212' }]}>{item.projectName}</Text>
        <Text style={styles.draftDate}>{date}</Text>
        <Text style={styles.draftPreview}>{preview}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <Text style={[styles.title, { color: isDark ? '#FFF' : '#121212' }]}>Subtitle Studio</Text>
      <Text style={styles.subtitle}>AI-powered subtitle tools</Text>

      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('AudioToSRT')}
        activeOpacity={0.75}
      >
        <Text style={styles.cardTitle}>🎵 Audio to SRT</Text>
        <Text style={styles.cardDesc}>Generate subtitles from audio using AI</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('ManualEditorHome')}
        activeOpacity={0.75}
      >
        <Text style={styles.cardTitle}>✏️ SRT Manual Editor</Text>
        <Text style={styles.cardDesc}>Create or edit subtitle files offline</Text>
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
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
  card: {
    backgroundColor: '#5C35C8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  cardDesc: { color: '#E0E0E0', fontSize: 14 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 16 },
  draftCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  draftTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  draftDate: { fontSize: 12, color: '#888', marginBottom: 8 },
  draftPreview: { fontSize: 14, color: '#666' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  list: { paddingBottom: 40 },
});
