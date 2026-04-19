import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, useColorScheme, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';

export type AlertButton = {
  text: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: (value?: string) => void;
};

export type CustomAlertConfig = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  isPrompt?: boolean;
  defaultValue?: string;
  placeholder?: string;
};

interface Props {
  visible: boolean;
  config: CustomAlertConfig | null;
  onClose: () => void;
}

export const CustomAlert: React.FC<Props> = ({ visible, config, onClose }) => {
  const isDark = useColorScheme() === 'dark';
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (visible && config?.defaultValue) {
      setInputValue(config.defaultValue);
    } else if (visible) {
      setInputValue('');
    }
  }, [visible, config]);

  if (!config) return null;

  const handleButtonPress = (btn: AlertButton) => {
    onClose();
    if (btn.onPress) {
      // Small timeout to allow modal to close before executing action
      setTimeout(() => btn.onPress!(config.isPrompt ? inputValue : undefined), 50);
    }
  };

  const buttons = config.buttons || [{ text: 'OK', onPress: () => {} }];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.alertContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDark ? '#FFF' : '#121212' }]}>{config.title}</Text>
          
          {config.message ? (
            <Text style={[styles.message, { color: isDark ? '#CCC' : '#666' }]}>{config.message}</Text>
          ) : null}

          {config.isPrompt && (
            <TextInput
              style={[styles.input, { 
                color: isDark ? '#FFF' : '#121212',
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                borderColor: isDark ? '#444' : '#E0E0E0'
              }]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={config.placeholder}
              placeholderTextColor={isDark ? '#888' : '#AAA'}
              autoFocus
            />
          )}

          <View style={styles.buttonRow}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              let textColor = '#5C35C8'; // Default primary
              if (isDestructive) textColor = '#FF3B30';
              if (isCancel) textColor = isDark ? '#AAA' : '#888';

              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.button} 
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.buttonText, 
                    { color: textColor },
                    (!isCancel && !isDestructive) && { fontWeight: 'bold' }
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    paddingTop: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  input: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
