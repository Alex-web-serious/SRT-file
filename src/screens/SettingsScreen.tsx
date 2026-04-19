import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const APP_VERSION = '1.0.0';

// Replace these with your actual URLs
const LINKS = {
  contactUs: 'https://example.com/contact',
  privacyPolicy: 'https://example.com/privacy',
  termsOfService: 'https://example.com/terms',
};

export const SettingsScreen = () => {
  const isDark = useColorScheme() === 'dark';
  const navigation = useNavigation();

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const menuItems = [
    {
      icon: 'mail-outline' as const,
      label: 'Contact Us',
      onPress: () => openLink(LINKS.contactUs),
    },
    {
      icon: 'shield-checkmark-outline' as const,
      label: 'Privacy Policy',
      onPress: () => openLink(LINKS.privacyPolicy),
    },
    {
      icon: 'document-text-outline' as const,
      label: 'Terms of Service',
      onPress: () => openLink(LINKS.termsOfService),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={isDark ? '#FFF' : '#121212'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#FFF' : '#121212' }]}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#E8E8E8' },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={22} color="#5C35C8" />
                </View>
                <Text style={[styles.menuItemText, { color: isDark ? '#FFF' : '#121212' }]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#CCC'} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Version at bottom */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Subtitle Studio</Text>
        <Text style={styles.versionNumber}>Version {APP_VERSION}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8, width: 44 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(92, 53, 200, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 12,
  },
  versionText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    marginBottom: 2,
  },
  versionNumber: {
    fontSize: 13,
    color: '#666',
  },
});
