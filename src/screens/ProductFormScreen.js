import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createProduct, updateProduct, getCategories } from '../services/products';
import { useProducts } from '../contexts/ProductsContext';

export default function ProductFormScreen({ navigation, route }) {
  const { product } = route.params;
  const editing = !!product;
  const { addProduct, updateProduct: updateLocal, localProducts } = useProducts();

  const isLocalProduct = editing && localProducts.some((p) => p.id === product.id);

  const [title, setTitle] = useState(product?.title || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
        if (!editing && data.length > 0) {
          const first = typeof data[0] === 'string' ? data[0] : data[0].slug;
          setCategory(first);
        }
      } catch {
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !price.trim() || !stock.trim() || !category.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
      Alert.alert('Atenção', 'Preço e estoque devem ser números válidos.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category.trim(),
    };

    setLoading(true);
    try {
      if (editing) {
        if (!isLocalProduct) {
          await updateProduct(product.id, payload);
        }
        updateLocal(product.id, payload);
        Alert.alert('Sucesso', 'Produto atualizado!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const created = await createProduct(payload);
        addProduct({ ...payload, thumbnail: created.thumbnail || '' });
        Alert.alert('Sucesso', 'Produto cadastrado!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>
        {editing ? 'Editar produto' : 'Novo produto'}
      </Text>

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do produto"
        placeholderTextColor="#AAA"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descrição do produto"
        placeholderTextColor="#AAA"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Preço (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor="#AAA"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Estoque</Text>
      <TextInput
        style={styles.input}
        placeholder="Quantidade em estoque"
        placeholderTextColor="#AAA"
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Categoria</Text>
      {loadingCategories ? (
        <ActivityIndicator color="#6C63FF" style={{ marginBottom: 16 }} />
      ) : (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(value) => setCategory(value)}
            style={styles.picker}
          >
            {categories.map((cat, index) => {
              const slug = typeof cat === 'string' ? cat : cat.slug;
              const name = typeof cat === 'string' ? cat : cat.name;
              return (
                <Picker.Item key={slug || index} label={name} value={slug} />
              );
            })}
          </Picker>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>
            {editing ? 'Salvar alterações' : 'Cadastrar produto'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#222',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#222',
  },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});