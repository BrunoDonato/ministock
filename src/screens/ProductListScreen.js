import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listProducts, searchProducts, getCategories, getProductsByCategory } from '../services/products';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductsContext';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import CategoryList from '../components/CategoryList';

const LIMIT = 10;

export default function ProductListScreen({ navigation }) {
  const { signOut, user } = useAuth();
  const { localProducts, editedProducts, mergeWithEdits } = useProducts();
  const [apiProducts, setApiProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const skip = useRef(0);
  const searchTimeout = useRef(null);

  const mergedApi = mergeWithEdits(
    selectedCategory ? categoryProducts : apiProducts,
    selectedCategory
  );
  const localFiltered = selectedCategory
    ? localProducts.filter((p) => p.category === selectedCategory)
    : localProducts;
  const editedInCategory = selectedCategory
    ? Object.values(editedProducts)
        .filter(
          (e) =>
            e.category === selectedCategory &&
            !localProducts.some((p) => p.id === e.id)
        )
        .map((e) => {
          const original =
            apiProducts.find((p) => p.id === e.id) ||
            categoryProducts.find((p) => p.id === e.id);
          return original ? { ...original, ...e } : null;
        })
        .filter(Boolean)
    : [];
  const products = [...localFiltered, ...editedInCategory, ...mergedApi];

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {}
  }

  async function loadApiProducts(reset = false) {
    try {
      setError(null);
      const currentSkip = reset ? 0 : skip.current;
      const data = await listProducts({ limit: LIMIT, skip: currentSkip });

      if (reset) {
        setApiProducts(data.products);
        skip.current = LIMIT;
      } else {
        setApiProducts((prev) => [...prev, ...data.products]);
        skip.current = currentSkip + LIMIT;
      }

      setHasMore(skip.current < data.total);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSearch(text) {
    setSearch(text);
    setSelectedCategory(null);
    clearTimeout(searchTimeout.current);

    if (!text.trim()) {
      setLoadingCategory(true);
      await loadApiProducts(true);
      setLoadingCategory(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setLoadingCategory(true);
      try {
        setError(null);
        const data = await searchProducts(text.trim());
        setApiProducts(data.products);
        setHasMore(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingCategory(false);
      }
    }, 500);
  }

  async function handleSelectCategory(category) {
    setSearch('');
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setCategoryProducts([]);
      return;
    }

    setSelectedCategory(category);
    setLoadingCategory(true);
    try {
      setError(null);
      const data = await getProductsByCategory(category);
      setCategoryProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCategory(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setSearch('');
    setSelectedCategory(null);
    setCategoryProducts([]);
    await loadApiProducts(true);
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore || search || selectedCategory) return;
    setLoadingMore(true);
    await loadApiProducts(false);
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
        await loadApiProducts(true);
        setLoading(false);
        await loadCategories();
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

      {loadingCategory && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color="#6C63FF" />
          <Text style={styles.loadingBarText}>Carregando...</Text>
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar produto..."
        placeholderTextColor="#AAA"
        value={search}
        onChangeText={handleSearch}
      />

      <View style={styles.categoriesWrapper}>
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleSelectCategory}
        />
      </View>

      <View style={styles.listWrapper}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadApiProducts(true)}>
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
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#6C63FF']}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? <Loading /> : null}
            contentContainerStyle={products.length === 0 && styles.emptyList}
          />
        )}
      </View>

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
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
    backgroundColor: '#EEE',
  },
  loadingBarText: {
    fontSize: 12,
    color: '#6C63FF',
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
  categoriesWrapper: {
    zIndex: 1,
  },
  listWrapper: {
    flex: 1,
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