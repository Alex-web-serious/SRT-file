import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { SubtitleBlock } from '../types';

interface Props {
  blocks: SubtitleBlock[];
  onUpdateBlocks: (newBlocks: SubtitleBlock[]) => void;
}

export const TranscriptView: React.FC<Props> = ({ blocks, onUpdateBlocks }) => {
  const isDark = useColorScheme() === 'dark';
  const [text, setText] = useState('');

  useEffect(() => {
    const combined = blocks.map(b => b.text).join(' ');
    setText(combined);
  }, [blocks]);

  const handleChange = (newText: string) => {
    setText(newText);
    
    // Debounce sync — distribute edited text evenly across existing blocks
    setTimeout(() => {
      const words = newText.split(/\s+/).filter(w => w.length > 0);
      const blockCount = blocks.length || 1;
      const wordsPerBlock = Math.max(1, Math.ceil(words.length / blockCount));
      const updatedBlocks = [...blocks];
      
      for (let i = 0; i < updatedBlocks.length; i++) {
        const start = i * wordsPerBlock;
        const chunk = words.slice(start, start + wordsPerBlock).join(' ');
        updatedBlocks[i] = { ...updatedBlocks[i], text: chunk };
      }
      
      onUpdateBlocks(updatedBlocks);
    }, 300);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          { 
            color: isDark ? '#FFFFFF' : '#121212',
            backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5'
          }
        ]}
        multiline
        value={text}
        onChangeText={handleChange}
        placeholder="Start typing your transcript here..."
        placeholderTextColor="#888"
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
    fontSize: 16,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
});
