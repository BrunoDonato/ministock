import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listProducts, searchProducts, getCategories, getProductsByCategory } from '../services/products';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const LIMIT = 10;

export default function ProductListScreen({ navigation }) {
  const { signOut, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const skip = useRef(0);
  const searchTimeout = useRef(null);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {}
  }

  async function loadProducts(reset = false) {
    try {
      setError(null);
      const currentSkip = reset ? 0 : skip.current;
      const data = await listProducts({ limit: LIMIT, skip: currentSkip });

      if (reset) {
        setProducts(data.products);
        skip.current = LIMIT;
      } else {
        setProducts((prev) => [...prev, ...data.products]);
        skip.current = currentSkip + LIMIT;
      }

      setHasMore(skip.current < data.total);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadByCategory(category) {
    setLoading(true);
    try {
      setError(null);
      const data = await getProductsByCategory(category);
      setProducts(data.products);
      setHasMore(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(text) {
    setSearch(text);
    clearTimeout(searchTimeout.current);

    if (!text.trim()) {
      setSelectedCategory(null);
      setLoading(true);
      await loadProducts(true);
      setLoading(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        setError(null);
        const data = await searchProducts(text.trim());
        setProducts(data.products);
        setHasMore(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 500);
  }

  async function handleSelectCategory(category) {
    setSearch('');
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setLoading(true);
      await loadProducts(true);
      setLoading(false);
      return;
    }
    setSelectedCategory(category);
    await loadByCategory(category);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setSearch('');
    setSelectedCategory(null);
    await loadProducts(true);
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore || search || selectedCategory) return;
    setLoadingMore(true);
    await loadProducts(false);
    setLoadingMore(false);
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => await signOut(),
      },
    ]);
  }

  useFocusEffect(
    useCallback(() => {
      async function init() {
        setLoading(true);
        await Promise.all([loadCategories(), loadProducts(true)]);
        setLoading(false);
      }
      init();
    }, [])
  );

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MiniStock</Text>
          <Text style={styles.headerSub}>Olá, {user?.firstName || 'usuário'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar produto..."
        placeholderTextColor="#AAA"
        value={search}
        onChangeText={handleSearch}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={[styles.categoryChip, selectedCategory === cat.slug && styles.categoryChipActive]}
            onPress={() => handleSelectCategory(cat.slug)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.slug && styles.categoryTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadProducts(true)}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
            />
          )}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6C63FF']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <Loading /> : null}
          contentContainerStyle={products.length === 0 && styles.emptyList}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProductForm', { product: null })}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 13,
    color: '#DDD',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFF',
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  categoryText: {
    fontSize: 13,
    color: '#555',
    textTransform: 'capitalize',
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 15,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
  },
  emptyList: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6C63FF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});