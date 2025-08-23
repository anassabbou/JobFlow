import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JobApplication, JobApplicationStatus } from '../types/JobApplication';
import { JobApplicationCard } from '../components/JobApplicationCard';
import { StatsOverview } from '../components/StatsOverview';
import { useAuth } from '../contexts/AuthContext';
import { firebaseJobApplicationService } from '../services/firebaseJobApplicationService';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobApplicationStatus | 'all'>('all');
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      setupRealtimeListener();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const setupRealtimeListener = () => {
    if (!user) return;

    const unsubscribeFn = firebaseJobApplicationService.subscribeToApplications(
      user.id,
      (apps) => {
        setApplications(apps);
        setLoading(false);
      }
    );
    
    setUnsubscribe(() => unsubscribeFn);
  };

  const loadApplications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const apps = await firebaseJobApplicationService.getApplications(user.id);
      setApplications(apps);
    } catch (error) {
      Alert.alert('Error', 'Failed to load applications');
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await firebaseJobApplicationService.deleteApplication(id);
      // Real-time listener will automatically update the UI
    } catch (error) {
      Alert.alert('Error', 'Failed to delete application');
      console.error('Error deleting application:', error);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const renderApplication = ({ item }: { item: JobApplication }) => (
    <JobApplicationCard
      application={item}
      onPress={() => {
        // Navigate to detail screen
        console.log('Navigate to detail:', item.id);
      }}
      onEdit={() => {
        // Navigate to edit screen
        console.log('Navigate to edit:', item.id);
      }}
      onDelete={() => handleDeleteApplication(item.id)}
    />
  );

  const renderHeader = () => (
    <View>
      <StatsOverview applications={applications} />
      
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search applications..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <View style={styles.filterContainer}>
          <Ionicons name="filter" size={20} color="#6B7280" style={styles.filterIcon} />
          <Text style={styles.filterLabel}>Filter:</Text>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {(['applied', 'interview', 'offer', 'rejected'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, statusFilter === status && styles.filterButtonActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterButtonText, statusFilter === status && styles.filterButtonTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.subtitle}>Track your job applications</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredApplications}
        renderItem={renderApplication}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddApplication')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  controls: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});