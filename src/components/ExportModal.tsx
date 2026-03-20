import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const isDark = useColorScheme() === 'dark';
  const [selectedFormat, setSelectedFormat] = useState<'srt' | 'txt' | null>(null);

  const handleExport = async () => {
    if (!selectedFormat) {
      Alert.alert('Select Format', 'Please select a format before exporting.');
      return;
    }

    try {
      const safeName = sanitizeFilename(projectName);
      const filename = `${safeName}.${selectedFormat}`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      
      let content = '';
      if (selectedFormat === 'srt') {
        content = buildSRT(blocks);
      } else {
        content = blocks.map(b => b.text).join('\n');
      }

      await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: selectedFormat === 'srt' ? 'application/x-subrip' : 'text/plain',
          dialogTitle: `Export ${filename}`
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not export file. Please try again.');
    } finally {
      setSelectedFormat(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFormat(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          <Text style={[styles.title, { color: isDark ? '#FFF' : '#121212' }]}>Export Project</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#999' : '#666' }]}>Choose export format</Text>

          {/* Format Options */}
          <View style={styles.formatRow}>
            <TouchableOpacity
              style={[
                styles.formatCard,
                { borderColor: isDark ? '#333' : '#E0E0E0', backgroundColor: isDark ? '#252525' : '#F8F8F8' },
                selectedFormat === 'srt' && styles.formatCardSelected,
              ]}
              onPress={() => setSelectedFormat('srt')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={selectedFormat === 'srt' ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selectedFormat === 'srt' ? '#5C35C8' : isDark ? '#666' : '#CCC'}
              />
              <View style={styles.formatInfo}>
                <Text style={[styles.formatTitle, { color: isDark ? '#FFF' : '#121212' }]}>.SRT</Text>
                <Text style={[styles.formatDesc, { color: isDark ? '#999' : '#666' }]}>With timestamps</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatCard,
                { borderColor: isDark ? '#333' : '#E0E0E0', backgroundColor: isDark ? '#252525' : '#F8F8F8' },
                selectedFormat === 'txt' && styles.formatCardSelected,
              ]}
              onPress={() => setSelectedFormat('txt')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={selectedFormat === 'txt' ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selectedFormat === 'txt' ? '#5C35C8' : isDark ? '#666' : '#CCC'}
              />
              <View style={styles.formatInfo}>
                <Text style={[styles.formatTitle, { color: isDark ? '#FFF' : '#121212' }]}>.TXT</Text>
                <Text style={[styles.formatDesc, { color: isDark ? '#999' : '#666' }]}>Plain text</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Export Button */}
          <TouchableOpacity
            style={[styles.exportBtn, !selectedFormat && styles.exportBtnDisabled]}
            onPress={handleExport}
            activeOpacity={0.75}
          >
            <Ionicons name="share-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.exportBtnText}>Export</Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.75}>
            <Text style={[styles.cancelText, { color: isDark ? '#FF6B6B' : '#FF3B30' }]}>Cancel</Text>
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
    justifyContent: 'flex-start',
  },
  panel: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    paddingTop: 12,
    paddingBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  formatCardSelected: {
    borderColor: '#5C35C8',
    borderWidth: 2,
  },
  formatInfo: {
    marginLeft: 10,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formatDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: '#5C35C8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  exportBtnDisabled: {
    backgroundColor: '#A090D0',
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
