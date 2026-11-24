import { FormEvent, useState } from 'react';
import { Box, Button, Container, Flex, Heading, HStack, Input, InputGroup, InputRightElement, Link, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductPage from './pages/ProductPage';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { useCart } from './cart';
import { CATEGORIES, SHOP } from './shop';

const nav = [{ to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' }, { to: '/contact', label: 'Contact' }];

function Header() {
  const go = useNavigate();
  const { count } = useCart();
  const [q, setQ] = useState('');
  const search = (e: FormEvent) => { e.preventDefault(); go(`/shop?q=${encodeURIComponent(q)}`); };
  return (
    <Box as="header" bg="#efeae6" borderBottom="1px solid" borderColor="blackAlpha.100">
      <Container maxW="7xl" py={4}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            <Heading size="lg" fontWeight={700}>Mother’s Love Crafts</Heading>
          </Link>
          <HStack as="nav" aria-label="Main" spacing={8} order={{ base: 3, md: 2 }} w={{ base: 'full', md: 'auto' }}>
            {nav.map((n) => (
              <Link key={n.to} as={NavLink} to={n.to} end={n.to === '/'} fontWeight="500" _hover={{ color: 'plum.500', textDecoration: 'none' }}
                sx={{ '&.active': { color: 'plum.500' } }}>{n.label}</Link>
            ))}
          </HStack>
          <HStack spacing={6} order={{ base: 2, md: 3 }}>
          <Box as="form" onSubmit={search} role="search">
            <InputGroup size="sm" w="220px">
              <Input variant="flushed" placeholder="Search" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
              <InputRightElement><Button type="submit" size="xs" variant="unstyled" aria-label="Search" minW="auto">⌕</Button></InputRightElement>
            </InputGroup>
          </Box>
          <Link as={RouterLink} to="/cart" fontWeight="500" whiteSpace="nowrap" aria-label={`Cart, ${count} items`}>Cart ({count})</Link>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

function Footer() {
  const h = { fontSize: 'md', fontWeight: 700, mb: 3, color: 'white' } as const;
  return (
    <Box as="footer" bg="black" color="whiteAlpha.800" mt={20}>
      <Container maxW="7xl" py={14}>
        <Flex justify="space-between" align={{ md: 'flex-end' }} direction={{ base: 'column', md: 'row' }} gap={6}>
          <Box>
            <Heading size="xl" color="white" fontWeight={700}>Mother’s Love Crafts</Heading>
            <Text mt={2}>Bags, shoes, sandals, school supplies and cookies.</Text>
          </Box>
          <Button as={RouterLink} to="/contact" size="lg">Send us a message</Button>
        </Flex>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8} mt={14}>
          <Stack spacing={2}><Text {...h}>Pages</Text>
            {nav.map((n) => <Link key={n.to} as={RouterLink} to={n.to}>{n.label}</Link>)}</Stack>
          <Stack spacing={2}><Text {...h}>Shop by type</Text>
            {CATEGORIES.map((c) => <Link key={c} as={RouterLink} to={`/shop?category=${encodeURIComponent(c)}`}>{c}</Link>)}</Stack>
          <Stack spacing={2}><Text {...h}>Visit us</Text><Text>{SHOP.address}</Text><Text>{SHOP.hours}</Text></Stack>
          <Stack spacing={2}><Text {...h}>Get in touch</Text>
            <Link href={`tel:${SHOP.phone}`}>{SHOP.phone}</Link><Link href={`mailto:${SHOP.email}`}>{SHOP.email}</Link></Stack>
        </SimpleGrid>
        <Flex mt={12} pt={6} borderTop="1px solid" borderColor="whiteAlpha.300" justify="space-between" fontSize="sm" wrap="wrap" gap={2}>
          <Text>© {new Date().getFullYear()} Mother’s Love Crafts</Text>
          <Link as={RouterLink} to="/admin">Staff login</Link>
        </Flex>
      </Container>
    </Box>
  );
}

export default function App() {
  return (
    <Flex minH="100vh" direction="column">
      <Header />
      <Box as="main" flex="1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ProductPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Container py={16}><Heading size="lg">Page not found</Heading></Container>} />
        </Routes>
      </Box>
      <Footer />
    </Flex>
  );
}
