import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Flex, Grid, Heading, Link, SimpleGrid, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { api, Product } from '../api';
import { ProductCard, ProductImage, Stars } from '../components';

type Quote = { text: string; author: string; product: string; rating: number };

const Head = ({ label, title }: { label: string; title: string }) => (
  <Box mb={8}>
    <Text fontSize="sm" color="gray.600">{label}</Text>
    <Heading as="h2" fontSize={{ base: '2xl', md: '4xl' }} fontWeight={500}>{title}</Heading>
  </Box>
);

export default function Home() {
  const [items, setItems] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    api.products().then(async (p) => {
      setItems(p);
      const rated = p.filter((x) => x.reviewCount > 0).sort((a, b) => b.averageRating - a.averageRating).slice(0, 4);
      const found = await Promise.all(rated.map((x) => api.product(String(x.id)).then((d) => ({ x, r: d.reviews[0] }))));
      setQuotes(found.filter((f) => f.r).map(({ x, r }) => ({ text: r.comment, author: r.author, product: x.name, rating: r.rating })));
    }).catch(() => setItems([]));
  }, []);

  const best = useMemo(() => [...items].sort((a, b) => b.averageRating - a.averageRating), [items]);
  const latest = useMemo(() => [...items].sort((a, b) => b.id - a.id).slice(0, 8), [items]);
  const cats = useMemo(() => {
    const m = new Map<string, Product>();
    items.forEach((p) => { if (!m.has(p.category) || (!m.get(p.category)!.imageUrl && p.imageUrl)) m.set(p.category, p); });
    return [...m.entries()].slice(0, 6);
  }, [items]);
  const hero = best.find((p) => p.imageUrl) ?? best[0];

  return (
    <>
      <Box bg="#efeae6">
        <Container maxW="7xl" py={{ base: 10, md: 20 }}>
          <Grid templateColumns={{ base: '1fr', md: '1.2fr 1fr' }} gap={{ base: 10, md: 16 }} alignItems="center">
            <Box>
              <Heading as="h1" fontSize={{ base: '3rem', md: '5rem' }} lineHeight="1.05" fontWeight={700}>
                Handmade bags, shoes and treats
              </Heading>
              <Text mt={6} fontSize="lg" maxW="46ch" color="gray.700">
                Bags, shoes, sandals, school supplies and cookies, made with care by Mother’s Love Crafts.
              </Text>
              <Button as={RouterLink} to="/shop" size="lg" mt={8} px={8}>SHOP NOW</Button>
            </Box>
            <Box bg="#e6ddd6" borderRadius="md" p={{ base: 4, md: 8 }}>
              {hero ? <ProductImage p={hero} h={{ base: '300px', md: '460px' }} bg="transparent" />
                : <Flex h="300px" align="center" justify="center"><Heading size="4xl" color="#cfc4bb">M</Heading></Flex>}
            </Box>
          </Grid>
        </Container>
      </Box>

      <Container maxW="7xl">
        {cats.length > 0 && (
          <SimpleGrid columns={{ base: 2, sm: 3, md: Math.min(cats.length, 5) }} spacing={6} py={{ base: 12, md: 20 }}>
            {cats.map(([name, p]) => (
              <Link key={name} as={RouterLink} to={`/shop?category=${encodeURIComponent(name)}`} textAlign="center" _hover={{ textDecoration: 'none', color: 'plum.500' }}>
                <ProductImage p={p} h="140px" bg="transparent" />
                <Text mt={2}>{name}</Text>
              </Link>
            ))}
          </SimpleGrid>
        )}

        <Head label="Best selling" title="Featured collection" />
        {best.length === 0 ? <Text color="gray.600">New pieces are on their way. Check back soon.</Text> : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>{best.slice(0, 3).map((p) => <ProductCard key={p.id} p={p} />)}</SimpleGrid>
        )}

        {latest.length > 3 && (
          <Box mt={{ base: 16, md: 24 }}>
            <Head label="Recently released" title="Latest products" />
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>{latest.map((p) => <ProductCard key={p.id} p={p} />)}</SimpleGrid>
          </Box>
        )}

        {quotes.length > 0 && (
          <Box mt={{ base: 16, md: 24 }}>
            <Head label="Testimonials" title="Customer reviews" />
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {quotes.map((q, i) => (
                <Flex key={i} gap={5} bg="white" p={6} borderRadius="md" direction="column" justify="space-between">
                  <Box><Stars value={q.rating} /><Text mt={3}>{q.text}</Text></Box>
                  <Box><Text fontWeight="600">{q.author}</Text><Text fontSize="sm" color="gray.600">on {q.product}</Text></Box>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} mt={{ base: 16, md: 24 }}>
          {[['Handmade with care', 'Every bag, shoe and sandal is made by hand, one piece at a time.'],
            ['Everything for school', 'Bags and school supplies in one place, ready for the new term.'],
            ['Ask us anything', 'Not sure what you need? Send us a message and we’ll help you choose.']].map(([t, d]) => (
            <Box key={t} borderTop="1px solid" borderColor="blackAlpha.300" pt={5}>
              <Heading as="h3" size="md" fontWeight={500}>{t}</Heading>
              <Text mt={2} color="gray.700">{d}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </>
  );
}
