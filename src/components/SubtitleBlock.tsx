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
  const cardBorder = isDark ? '#333333' : '#E0E0E0';
  const inputBorder = isDark ? '#444444' : '#CCCCCC';
  const labelColor = isDark ? '#999999' : '#888888';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor: cardBorder }]}>
      {/* Header: Block number + Delete */}
      <View style={styles.header}>
        <Text style={[styles.idText, { color: textColor }]}>#{index + 1}</Text>
        <TouchableOpacity onPress={onDelete} activeOpacity={0.75} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color={isDark ? '#8A8A9E' : '#999'} />
        </TouchableOpacity>
      </View>

      {/* Time Row with labeled outlined fields */}
      <View style={styles.timeRow}>
        <View style={[styles.timeFieldWrapper, { borderColor: inputBorder }]}>
          <Text style={[styles.timeLabel, { color: labelColor, backgroundColor: bgColor }]}>Start</Text>
          <TextInput
            style={[styles.timeInput, { color: textColor }]}
            value={block.startTime}
            onChangeText={(text) => onUpdate({ ...block, startTime: text })}
            selectionColor="#5C35C8"
          />
        </View>

        <Text style={[styles.arrow, { color: labelColor }]}>→</Text>

        <View style={[styles.timeFieldWrapper, { borderColor: inputBorder }]}>
          <Text style={[styles.timeLabel, { color: labelColor, backgroundColor: bgColor }]}>End</Text>
          <TextInput
            style={[styles.timeInput, { color: textColor }]}
            value={block.endTime}
            onChangeText={(text) => onUpdate({ ...block, endTime: text })}
            selectionColor="#5C35C8"
          />
        </View>
      </View>

      {/* Subtitle Text Area */}
      <View style={[styles.textFieldWrapper, { borderColor: inputBorder }]}>
        <TextInput
          style={[styles.textInput, { color: textColor }]}
          multiline
          value={block.text}
          onChangeText={(text) => onUpdate({ ...block, text })}
          placeholder="Subtitle text here..."
          placeholderTextColor={isDark ? '#555' : '#AAA'}
          selectionColor="#5C35C8"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteBtn: {
    padding: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeFieldWrapper: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
  },
  timeLabel: {
    position: 'absolute',
    top: -9,
    left: 12,
    fontSize: 12,
    paddingHorizontal: 4,
    fontWeight: '500',
  },
  timeInput: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    padding: 0,
    textAlign: 'left',
  },
  arrow: {
    marginHorizontal: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  textFieldWrapper: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 0,
    lineHeight: 24,
  },
});
