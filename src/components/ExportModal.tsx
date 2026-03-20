import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SubtitleBlock } from '../types';
import { buildSRT } from '../utils/srtBuilder';

interface Props {
  visible: boolean;
  projectName: string;
  blocks: SubtitleBlock[];
  onClose: () => void;
}

const sanitizeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'untitled';

export const ExportModal: React.FC<Props> = ({ visible, projectName, blocks, onClose }) => {
  const handleExport = async (type: 'srt' | 'txt') => {
    try {
      const safeName = sanitizeFilename(projectName);
      const filename = `${safeName}.${type}`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      
      let content = '';
      if (type === 'srt') {
        content = buildSRT(blocks);
      } else {
        content = blocks.map(b => b.text).join('\n');
      }

      await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        Alert.alert('Success', 'File ready to share!');
        await Sharing.shareAsync(fileUri, {
          mimeType: type === 'srt' ? 'application/x-subrip' : 'text/plain',
          dialogTitle: `Export ${filename}`
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not export file. Please try again.');
    } finally {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Export Project</Text>
          
          <TouchableOpacity style={styles.button} onPress={() => handleExport('srt')} activeOpacity={0.75}>
            <Text style={styles.buttonText}>Export as .srt</Text>
            <Text style={styles.subText}>Subtitle file with timestamps</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={() => handleExport('txt')} activeOpacity={0.75}>
            <Text style={styles.buttonText}>Export as .txt</Text>
            <Text style={styles.subText}>Plain text without timestamps</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onClose} activeOpacity={0.75}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#121212',
  },
  button: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#121212',
  },
  subText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  cancelBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
});
