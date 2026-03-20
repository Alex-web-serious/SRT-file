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
    const combined = blocks.map(b => b.text).join('\n\n');
    setText(combined);
  }, [blocks]);

  const handleChange = (newText: string) => {
    setText(newText);
    
    // Debounce sync
    setTimeout(() => {
      const chunks = newText.split('\n\n');
      const updatedBlocks = [...blocks];
      
      chunks.forEach((chunk, index) => {
        if (index < updatedBlocks.length) {
          updatedBlocks[index].text = chunk;
        } else {
          // Create new block if needed
          const lastBlock = updatedBlocks[updatedBlocks.length - 1];
          updatedBlocks.push({
            id: updatedBlocks.length + 1,
            startTime: lastBlock ? lastBlock.endTime : "00:00:00,000",
            endTime: lastBlock ? lastBlock.endTime : "00:00:02,000",
            text: chunk,
          });
        }
      });
      
      // Remove extra blocks if chunks were deleted
      if (chunks.length < updatedBlocks.length) {
        updatedBlocks.splice(chunks.length);
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
