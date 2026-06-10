import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { deleteProduct } from '../services/products';

export default function ProductDetailScreen({ navigation, route }) {
  const { product: initial } = route.params;
  const [product] = useState(initial);
  const [deleting, setDeleting] = useState(false);

  function handleEdit() {
    navigation.navigate('ProductForm', { product });
  }

  function handleDelete() {
    Alert.alert(
      'Remover produto',
      `Deseja remover "${product.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteProduct(product.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Erro', err.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={{ uri: product.thumbnail }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.body}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Preço</Text>
            <Text style={styles.infoValue}>R$ {product.price.toFixed(2)}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Estoque</Text>
            <Text style={styles.infoValue}>{product.stock} un.</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Avaliação</Text>
            <Text style={styles.infoValue}>⭐ {product.rating?.toFixed(1) ?? 'N/A'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.8}>
          <Text style={styles.editBtnText}>Editar produto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.deleteBtnText}>Remover produto</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: '#EEE',
  },
  body: {
    padding: 20,
  },
  category: {
    fontSize: 13,
    color: '#6C63FF',
    textTransform: 'capitalize',
    fontWeight: '600',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  editBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  editBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});