import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { parseSRT } from '../utils/srtParser';
import { saveProject, getProjectCount } from '../storage/db';
import { CustomAlert, CustomAlertConfig } from '../components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';

export const ManualEditorHomeScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [alertConfig, setAlertConfig] = useState<CustomAlertConfig | null>(null);

  const handleNewProject = async () => {
    const timestamp = Date.now();
    const count = await getProjectCount();
    const project = {
      projectId: timestamp.toString(),
      projectName: `Untitled Project ${count + 1}`,
      blocks: [{ id: 1, startTime: "00:00:00,000", endTime: "00:00:02,000", text: "" }],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await saveProject(project);
    navigation.replace('Editor', { project });
  };

  const handleOpenFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        
        if (!file.name.toLowerCase().endsWith('.srt')) {
          setAlertConfig({ title: 'Error', message: 'Please select a valid .srt file' });
          return;
        }

        const content = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
        const blocks = parseSRT(content);

        if (blocks.length === 0) {
          setAlertConfig({ title: 'Error', message: 'Invalid SRT file format. Could not read this file.' });
          return;
        }

        const timestamp = Date.now();
        const project = {
          projectId: timestamp.toString(),
          projectName: file.name.replace('.srt', ''),
          blocks,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        await saveProject(project);
        navigation.replace('Editor', { project });
      }
    } catch (err) {
      setAlertConfig({ title: 'Error', message: 'Could not read file. Please try again.' });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={28} color={isDark ? '#FFF' : '#121212'} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: isDark ? '#FFF' : '#121212' }]}>Manual Editor</Text>
      <Text style={styles.subtitle}>Create or import subtitle files</Text>

      {/* New Project Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#F8F8FF' }]}
        onPress={handleNewProject}
        activeOpacity={0.75}
      >
        <View style={styles.cardIconWrap}>
          <Ionicons name="add-circle-outline" size={30} color="#5C35C8" />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#121212' }]}>New Project</Text>
          <Text style={[styles.cardDesc, { color: isDark ? '#999' : '#666' }]}>Create a blank subtitle project</Text>
        </View>
      </TouchableOpacity>

      {/* Open SRT File Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#F8F8FF' }]}
        onPress={handleOpenFile}
        activeOpacity={0.75}
      >
        <View style={styles.cardIconWrap}>
          <Ionicons name="folder-open-outline" size={30} color="#5C35C8" />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#121212' }]}>Open SRT File</Text>
          <Text style={[styles.cardDesc, { color: isDark ? '#999' : '#666' }]}>Open an existing .srt file from your device</Text>
        </View>
      </TouchableOpacity>

      <CustomAlert visible={!!alertConfig} config={alertConfig} onClose={() => setAlertConfig(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backBtn: { padding: 8, marginBottom: 12, alignSelf: 'flex-start' },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32 },
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
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { fontSize: 14, lineHeight: 20 },
});
