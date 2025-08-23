import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JobApplicationStatus } from '../types/JobApplication';
import { useAuth } from '../contexts/AuthContext';
import { firebaseJobApplicationService } from '../services/firebaseJobApplicationService';

interface AddApplicationScreenProps {
  navigation: any;
}

export const AddApplicationScreen: React.FC<AddApplicationScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    status: 'applied' as JobApplicationStatus,
    applicationDate: new Date().toISOString().split('T')[0],
    notes: '',
    salary: '',
    jobUrl: '',
    contactPerson: '',
    contactEmail: '',
  });

  const handleSubmit = async () => {
    if (!user) return;

    if (!formData.company || !formData.position || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await firebaseJobApplicationService.createApplication(user.id, formData);
      Alert.alert('Success', 'Application added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add application');
      console.error('Error adding application:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { label: 'Applied', value: 'applied' },
    { label: 'Interview', value: 'interview' },
    { label: 'Offer', value: 'offer' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Application</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company *</Text>
            <TextInput
              style={styles.input}
              value={formData.company}
              onChangeText={(text) => setFormData(prev => ({ ...prev, company: text }))}
              placeholder="Enter company name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Position *</Text>
            <TextInput
              style={styles.input}
              value={formData.position}
              onChangeText={(text) => setFormData(prev => ({ ...prev, position: text }))}
              placeholder="Enter job position"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="Enter job location"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusButton,
                    formData.status === option.value && styles.statusButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, status: option.value as JobApplicationStatus }))}
                >
                  <Text style={[
                    styles.statusButtonText,
                    formData.status === option.value && styles.statusButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Application Date</Text>
            <TextInput
              style={styles.input}
              value={formData.applicationDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, applicationDate: text }))}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salary Range</Text>
            <TextInput
              style={styles.input}
              value={formData.salary}
              onChangeText={(text) => setFormData(prev => ({ ...prev, salary: text }))}
              placeholder="e.g., $80,000 - $100,000"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Person</Text>
            <TextInput
              style={styles.input}
              value={formData.contactPerson}
              onChangeText={(text) => setFormData(prev => ({ ...prev, contactPerson: text }))}
              placeholder="Enter contact name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Email</Text>
            <TextInput
              style={styles.input}
              value={formData.contactEmail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, contactEmail: text }))}
              placeholder="Enter contact email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job URL</Text>
            <TextInput
              style={styles.input}
              value={formData.jobUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, jobUrl: text }))}
              placeholder="Enter job posting URL"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Application'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});