import React, { memo, useState } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

const CategoryList = memo(({ categories, selectedCategory, onSelect }) => {
  const [laid, setLaid] = useState(false);

  return (
    <View onLayout={() => setLaid(true)} style={{ opacity: laid ? 1 : 0, height: 40, marginBottom: 8 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((item, index) => {
          const slug = typeof item === 'string' ? item : item.slug;
          const name = typeof item === 'string' ? item : item.name;
          return (
            <TouchableOpacity
              key={slug || index}
              style={[
                styles.categoryChip,
                selectedCategory === slug && styles.categoryChipActive,
              ]}
              onPress={() => onSelect(slug)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === slug && styles.categoryTextActive,
                ]}
              >
                {capitalize(name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

export default CategoryList;

const styles = StyleSheet.create({
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
});