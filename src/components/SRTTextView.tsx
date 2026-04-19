import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { SubtitleBlock } from '../types';
import { buildSRT } from '../utils/srtBuilder';
import { parseSRT } from '../utils/srtParser';

interface Props {
  blocks: SubtitleBlock[];
  onUpdateBlocks: (newBlocks: SubtitleBlock[]) => void;
}

export const SRTTextView: React.FC<Props> = ({ blocks, onUpdateBlocks }) => {
  const isDark = useColorScheme() === 'dark';
  const [text, setText] = useState('');

  useEffect(() => {
    const srtString = buildSRT(blocks);
    setText(srtString);
  }, [blocks]);

  const handleChange = (newText: string) => {
    setText(newText);

    // Debounce: parse the edited SRT text back into blocks
    setTimeout(() => {
      const parsed = parseSRT(newText);
      if (parsed.length > 0) {
        onUpdateBlocks(parsed);
      }
    }, 500);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            color: isDark ? '#E0E0E0' : '#1A1A1A',
            backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
          },
        ]}
        multiline
        value={text}
        onChangeText={handleChange}
        placeholder={'1\n00:00:01,000 --> 00:00:04,000\nSubtitle text here...'}
        placeholderTextColor="#555"
        selectionColor="#5C35C8"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
    lineHeight: 22,
  },
});
