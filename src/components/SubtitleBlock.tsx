import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { SubtitleBlock as SubtitleBlockType } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  block: SubtitleBlockType;
  index: number;
  onUpdate: (updatedBlock: SubtitleBlockType) => void;
  onDelete: () => void;
}

export const SubtitleBlockComponent: React.FC<Props> = ({ block, index, onUpdate, onDelete }) => {
  const isDark = useColorScheme() === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#121212';
  const bgColor = isDark ? '#1E1E1E' : '#F5F5F5';
  const borderColor = isDark ? '#333333' : '#E0E0E0';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.header}>
        <Text style={[styles.idText, { color: textColor }]}>#{index + 1}</Text>
        <TouchableOpacity onPress={onDelete} activeOpacity={0.75} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeRow}>
        <TextInput
          style={[styles.timeInput, { color: textColor, borderColor }]}
          value={block.startTime}
          onChangeText={(text) => onUpdate({ ...block, startTime: text })}
        />
        <Text style={[styles.arrow, { color: textColor }]}>→</Text>
        <TextInput
          style={[styles.timeInput, { color: textColor, borderColor }]}
          value={block.endTime}
          onChangeText={(text) => onUpdate({ ...block, endTime: text })}
        />
      </View>

      <TextInput
        style={[styles.textInput, { color: textColor, borderColor }]}
        multiline
        value={block.text}
        onChangeText={(text) => onUpdate({ ...block, text })}
        placeholder="Subtitle text here..."
        placeholderTextColor="#888"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteBtn: {
    padding: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  arrow: {
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
