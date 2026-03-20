import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isOnline } from '../utils/networkCheck';
import { isAllowedAudioFormat, isWavFile } from '../utils/fileValidator';
import { parseSRT } from '../utils/srtParser';
import { saveProject, getProjectCount } from '../storage/db';

// Replace YOUR_LOCAL_IP with your machine's local network IP (e.g. 192.168.1.10)
// This is needed because Expo Go on a physical phone cannot reach localhost
const BACKEND_URL = 'https://srt-file.onrender.com';

export const AudioToSRTScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    const online = await isOnline();
    if (!online) {
      Alert.alert(
        'Internet Required',
        'Please turn on internet to generate subtitles.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
          { text: 'Retry', onPress: checkNetwork }
        ]
      );
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp4', 'audio/aac'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        
        if (isWavFile(file.name) || !isAllowedAudioFormat(file.name)) {
          Alert.alert('Error', 'Only mp3, m4a, and aac files are supported');
          return;
        }
        setSelectedFile(file);
      }
    } catch (err) {
      // Silently do nothing on cancel
    }
  };

  const handleConvert = async () => {
    if (isConverting) {
      Alert.alert('Wait', 'Please wait, conversion already in progress');
      return;
    }
    if (!selectedFile) return;

    const online = await isOnline();
    if (!online) {
      Alert.alert('Error', 'No internet connection. Please check your connection.');
      return;
    }

    setIsConverting(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'audio/mpeg',
      } as any);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(`${BACKEND_URL}/transcribe-audio`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Transcription failed. Please try again.');
      }

      const srtText = await response.text();
      const blocks = parseSRT(srtText);
      
      const timestamp = Date.now();
      const count = await getProjectCount();
      const project = {
        projectId: timestamp.toString(),
        projectName: `Untitled Project ${count + 1}`,
        blocks,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveProject(project);
      navigation.replace('Editor', { project });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        Alert.alert('Error', 'Request timed out. Please try again.');
      } else {
        Alert.alert('Error', error.message || 'Transcription failed. Please try again.');
      }
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <Text style={[styles.title, { color: isDark ? '#FFF' : '#121212' }]}>Audio to SRT</Text>
      
      <TouchableOpacity style={styles.pickBtn} onPress={handlePickFile} activeOpacity={0.75}>
        <Text style={styles.pickBtnText}>Select Audio File</Text>
      </TouchableOpacity>
      
      {selectedFile && (
        <Text style={[styles.fileName, { color: isDark ? '#CCC' : '#666' }]}>
          Selected: {selectedFile.name}
        </Text>
      )}

      <TouchableOpacity 
        style={[styles.convertBtn, (!selectedFile || isConverting) && styles.disabledBtn]} 
        onPress={handleConvert}
        disabled={!selectedFile || isConverting}
        activeOpacity={0.75}
      >
        {isConverting ? (
          <View style={styles.row}>
            <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.convertBtnText}>Processing audio...</Text>
          </View>
        ) : (
          <Text style={styles.convertBtnText}>Convert to SRT</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
  pickBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#5C35C8',
    borderStyle: 'dashed',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickBtnText: { color: '#5C35C8', fontSize: 16, fontWeight: 'bold' },
  fileName: { textAlign: 'center', marginBottom: 24, fontSize: 14 },
  convertBtn: {
    backgroundColor: '#5C35C8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBtn: { backgroundColor: '#A090D0' },
  convertBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
