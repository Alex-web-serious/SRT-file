import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { parseSRT } from '../utils/srtParser';
import { saveProject, getProjectCount } from '../storage/db';

export const ManualEditorHomeScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

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
          Alert.alert('Error', 'Please select a valid .srt file');
          return;
        }

        const content = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
        const blocks = parseSRT(content);

        if (blocks.length === 0) {
          Alert.alert('Error', 'Invalid SRT file format. Could not read this file.');
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
      Alert.alert('Error', 'Could not read file. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <Text style={[styles.title, { color: isDark ? '#FFF' : '#121212' }]}>Manual Editor</Text>

      <TouchableOpacity style={styles.btn} onPress={handleNewProject} activeOpacity={0.75}>
        <Text style={styles.btnTitle}>New Project</Text>
        <Text style={styles.btnDesc}>Create a blank subtitle project</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={handleOpenFile} activeOpacity={0.75}>
        <Text style={styles.btnTitle}>Open SRT File</Text>
        <Text style={styles.btnDesc}>Open an existing .srt file from your device</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
  btn: {
    backgroundColor: '#5C35C8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  btnTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  btnDesc: { color: '#E0E0E0', fontSize: 14 },
});
