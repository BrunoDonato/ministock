import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ProductsProvider } from './src/contexts/ProductsContext';
import Loading from './src/components/Loading';
import LoginScreen from './src/screens/LoginScreen';
import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import ProductFormScreen from './src/screens/ProductFormScreen';

const Stack = createNativeStackNavigator();

function Routes() {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen
            name="ProductList"
            component={ProductListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              title: 'Detalhes do produto',
              headerBackTitle: 'Voltar',
              headerStyle: { backgroundColor: '#6C63FF' },
              headerTintColor: '#FFF',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />
          <Stack.Screen
            name="ProductForm"
            component={ProductFormScreen}
            options={({ route }) => ({
              title: route.params?.product ? 'Editar produto' : 'Novo produto',
              headerBackTitle: 'Voltar',
              headerStyle: { backgroundColor: '#6C63FF' },
              headerTintColor: '#FFF',
              headerTitleStyle: { fontWeight: '700' },
            })}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
      </ProductsProvider>
    </AuthProvider>
  );
}