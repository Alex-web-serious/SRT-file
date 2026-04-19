import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, useColorScheme, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export const DraftOptionsMenu: React.FC<Props> = ({ visible, onClose, onRename, onDelete }) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
              <Text style={[styles.menuTitle, { color: isDark ? '#888' : '#999' }]}>Project Options</Text>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => { onClose(); setTimeout(onRename, 50); }}
              >
                <Ionicons name="pencil-outline" size={20} color={isDark ? '#FFF' : '#121212'} />
                <Text style={[styles.menuItemText, { color: isDark ? '#FFF' : '#121212' }]}>Rename</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => { onClose(); setTimeout(onDelete, 50); }}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: 250,
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
});
