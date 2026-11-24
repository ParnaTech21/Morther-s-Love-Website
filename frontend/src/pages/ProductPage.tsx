import { FormEvent, useEffect, useState } from 'react';
import {
  Alert, AlertIcon, Box, Button, Container, Divider, Flex, FormControl, FormLabel, Grid, Heading, HStack, Input, Link,
  NumberInput, NumberInputField, Select, Spinner, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, useToast,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { api, Product, Review } from '../api';
import { useCart } from '../cart';
import { ProductImage, Stars } from '../components';
import { money, SHIPPING_INFO } from '../shop';

export default function ProductPage() {
  const { id } = useParams();
  const toast = useToast();
  const cart = useCart();
  const [data, setData] = useState<{ product: Product; reviews: Review[] } | null>(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ author: '', rating: 5, comment: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => { api.product(id!).then(setData).catch((e) => setError(e.message)); }, [id]);

  const addToCart = () => {
    cart.add(data!.product, qty);
    toast({ status: 'success', title: 'Added to cart', description: `${qty} × ${data!.product.name}` });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.addReview(data!.product.id, form);
      toast({ status: 'success', title: 'Thanks for your review', description: 'It will appear once we’ve approved it.' });
      setForm({ author: '', rating: 5, comment: '' });
    } catch (err) {
      toast({ status: 'error', title: (err as Error).message });
    } finally { setSending(false); }
  };

  if (error) return <Container py={10}><Alert status="error" borderRadius="md"><AlertIcon />We couldn’t find that product.</Alert></Container>;
  if (!data) return <Container py={10}><Spinner label="Loading product" /></Container>;
  const { product: p, reviews } = data;

  return (
    <Container maxW="7xl" py={{ base: 8, md: 12 }}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 8, md: 14 }} alignItems="center">
        <ProductImage p={p} h={{ base: '320px', md: '560px' }} />
        <Stack spacing={5}>
          <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} fontWeight={500}>{p.name}</Heading>
          <Text fontSize={{ base: 'xl', md: '3xl' }}>{money(p.price)}</Text>
          <Stars value={p.averageRating} count={p.reviewCount} />
          <Text color="gray.700" noOfLines={4} maxW="60ch">{p.description}</Text>
          <HStack spacing={4}>
            <NumberInput w="90px" min={1} max={99} value={qty} onChange={(_, n) => setQty(Number.isNaN(n) ? 1 : n)} bg="white">
              <NumberInputField aria-label="Quantity" borderRadius="none" />
            </NumberInput>
            <Button size="lg" px={8} onClick={addToCart}>ADD TO CART</Button>
          </HStack>
          <Divider borderColor="blackAlpha.300" />
          <Text fontSize="sm"><Text as="span" fontWeight="600">Category:</Text>{' '}
            <Link as={RouterLink} to={`/shop?category=${encodeURIComponent(p.category)}`} color="gray.700">{p.category}</Link></Text>
        </Stack>
      </Grid>

      <Tabs mt={{ base: 12, md: 16 }} colorScheme="plum">
        <TabList><Tab fontSize="lg">Product Overview</Tab><Tab fontSize="lg">Shipping Information</Tab></TabList>
        <TabPanels>
          <TabPanel px={0} pt={6}><Text maxW="80ch" whiteSpace="pre-line">{p.description || 'No description yet.'}</Text></TabPanel>
          <TabPanel px={0} pt={6}><Text maxW="80ch">{SHIPPING_INFO}</Text></TabPanel>
        </TabPanels>
      </Tabs>

      <Grid templateColumns={{ base: '1fr', md: '3fr 2fr' }} gap={10} mt={{ base: 12, md: 20 }}>
        <Box>
          <Text fontSize="sm" color="gray.600">Testimonials</Text>
          <Heading as="h2" fontSize={{ base: '2xl', md: '4xl' }} fontWeight={500} mb={6}>Customer reviews</Heading>
          {reviews.length === 0 ? (
            <Text color="gray.600">No reviews yet. Be the first to share what you think.</Text>
          ) : (
            <Stack spacing={4}>
              {reviews.map((r) => (
                <Box key={r.id} layerStyle="stitched" p={5}>
                  <Stars value={r.rating} />
                  <Text mt={2}>{r.comment}</Text>
                  <Text mt={3} fontWeight="600">{r.author}</Text>
                  <Text fontSize="sm" color="gray.600">{new Date(r.createdAt).toLocaleDateString()}</Text>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
        <Box as="form" onSubmit={submit} layerStyle="stitched" p={6} alignSelf="start">
          <Heading as="h2" size="md" mb={4}>Write a review</Heading>
          <Stack spacing={4}>
            <FormControl isRequired><FormLabel>Your name</FormLabel>
              <Input value={form.author} maxLength={80} onChange={(e) => setForm({ ...form, author: e.target.value })} /></FormControl>
            <FormControl><FormLabel>Rating</FormLabel>
              <Select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
                <option value={5}>5 – Loved it</option><option value={4}>4 – Really good</option><option value={3}>3 – It’s fine</option>
                <option value={2}>2 – Not great</option><option value={1}>1 – Disappointed</option>
              </Select></FormControl>
            <FormControl isRequired><FormLabel>Your review</FormLabel>
              <Textarea value={form.comment} maxLength={1000} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></FormControl>
            <Button type="submit" isLoading={sending}>Submit review</Button>
          </Stack>
        </Box>
      </Grid>
    </Container>
  );
}
