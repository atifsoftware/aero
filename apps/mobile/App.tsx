import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'erp' | 'ai'>('home');
  const [apiStatus, setApiStatus] = useState<string>('Connecting...');
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setApiStatus('API Connected (:3001)');
        }
      })
      .catch(() => {
        setApiStatus('Express Core Ready');
      });
  }, []);

  const handleAskAi = async () => {
    if (!prompt.trim()) return;
    setLoadingAi(true);
    setAiResponse('');
    try {
      const res = await fetch('http://localhost:3001/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setAiResponse(data.data?.response || data.message || 'AI query complete.');
    } catch (err: any) {
      setAiResponse(`Error: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e17" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoBadge}>⚡</Text>
          <Text style={styles.headerTitle}>NodeFlow Mobile</Text>
        </View>
        <Text style={styles.statusBadge}>● {apiStatus}</Text>
      </View>

      {/* Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentTab === 'home' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTag}>MULTI-PLATFORM STACK</Text>
              <Text style={styles.cardTitle}>Mobile App Connected</Text>
              <Text style={styles.cardDesc}>
                React Native (Expo) client communicating directly with NodeFlow Express 4 MVC Backend.
              </Text>
            </View>

            <Text style={styles.sectionHeading}>Quick Operations</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>🧾</Text>
                <Text style={styles.actionText}>Vouchers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionText}>Customers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => setCurrentTab('ai')}>
                <Text style={styles.actionIcon}>🤖</Text>
                <Text style={styles.actionText}>Gemini AI</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>Daily Sheet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentTab === 'erp' && (
          <View>
            <Text style={styles.sectionHeading}>Financial Overview</Text>
            <View style={styles.card}>
              <Text style={styles.cardTag}>TODAY'S CASH BALANCE</Text>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#10b981', marginVertical: 8 }}>
                ৳ 48,250
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 13 }}>
                Income: ৳ 62,500 &bull; Expense: ৳ 14,250
              </Text>
            </View>

            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.cardTag}>ACTIVE ACCOUNTS</Text>
              <Text style={{ color: '#f9fafb', fontSize: 16, fontWeight: '600', marginTop: 8 }}>
                Cash Drawer: ৳ 18,250
              </Text>
              <Text style={{ color: '#f9fafb', fontSize: 16, fontWeight: '600', marginTop: 4 }}>
                City Bank Ltd: ৳ 30,000
              </Text>
            </View>
          </View>
        )}

        {currentTab === 'ai' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTag}>AI ASSISTANT</Text>
              <Text style={styles.cardTitle}>Google Gemini 1.5 Flash</Text>
              <Text style={styles.cardDesc}>
                Ask real-time business queries or request instant summaries.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ask NodeFlow AI..."
                placeholderTextColor="#6b7280"
                value={prompt}
                onChangeText={setPrompt}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAskAi} disabled={loadingAi}>
                <Text style={styles.submitBtnText}>
                  {loadingAi ? 'Processing...' : 'Send Query →'}
                </Text>
              </TouchableOpacity>

              {aiResponse ? (
                <View style={styles.aiResultBox}>
                  <Text style={{ color: '#0ea5e9', fontWeight: 'bold', marginBottom: 6 }}>Response:</Text>
                  <Text style={{ color: '#f9fafb', lineHeight: 20 }}>{aiResponse}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, currentTab === 'home' && styles.navItemActive]}
          onPress={() => setCurrentTab('home')}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, currentTab === 'home' && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, currentTab === 'erp' && styles.navItemActive]}
          onPress={() => setCurrentTab('erp')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={[styles.navLabel, currentTab === 'erp' && styles.navLabelActive]}>ERP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, currentTab === 'ai' && styles.navItemActive]}
          onPress={() => setCurrentTab('ai')}
        >
          <Text style={styles.navIcon}>🤖</Text>
          <Text style={[styles.navLabel, currentTab === 'ai' && styles.navLabelActive]}>AI</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e17',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    fontSize: 20,
  },
  headerTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  cardTag: {
    color: '#0ea5e9',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeading: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  actionText: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  aiResultBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  navItem: {
    alignItems: 'center',
  },
  navItemActive: {},
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 4,
  },
  navLabelActive: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
});
