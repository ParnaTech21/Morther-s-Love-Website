import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertIcon, Button, Container, Heading, SimpleGrid, Spinner, Text, Wrap } from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import { api, Product } from '../api';
import { ProductCard } from '../components';

export default function Shop() {
  const [all, setAll] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const [params, setParams] = useSearchParams();
  const cat = params.get('category') ?? '';
  const q = (params.get('q') ?? '').toLowerCase();

  useEffect(() => { api.products().then(setAll).catch((e) => setError(e.message)); }, []);
  const cats = useMemo(() => [...new Set((all ?? []).map((p) => p.category))].sort(), [all]);
  const shown = (all ?? []).filter((p) => (!cat || p.category === cat) &&
    (!q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q)));

  return (
    <Container maxW="7xl" py={12}>
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} mb={2}>Shop</Heading>
      {q && <Text color="gray.600" mb={4}>Results for “{params.get('q')}”</Text>}
      {error && <Alert status="error" borderRadius="md"><AlertIcon />Couldn’t load products: {error}</Alert>}
      {!all && !error && <Spinner label="Loading products" mt={6} />}
      {all && (
        <>
          <Wrap my={8} role="group" aria-label="Filter by category">
            {['', ...cats].map((c) => (
              <Button key={c || 'all'} size="sm" variant={cat === c ? 'solid' : 'outline'} aria-pressed={cat === c}
                onClick={() => setParams(c ? { category: c } : {})}>{c || 'All'}</Button>
            ))}
          </Wrap>
          {shown.length === 0 ? (
            <Text color="gray.600">Nothing matches yet. Try another category or search.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 8, md: 6 }}>
              {shown.map((p) => <ProductCard key={p.id} p={p} />)}
            </SimpleGrid>
          )}
        </>
      )}
    </Container>
  );
}
