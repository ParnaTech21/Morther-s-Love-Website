import { Box, Button, Container, Divider, Flex, Heading, Image, Link, NumberInput, NumberInputField, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useCart } from '../cart';
import { money } from '../shop';

export default function Cart() {
  const { items, total, setQty, remove } = useCart();

  if (items.length === 0) return (
    <Container maxW="5xl" py={16}>
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }}>Your cart</Heading>
      <Text mt={4} color="gray.700">Your cart is empty. Find something you like in the shop.</Text>
      <Button as={RouterLink} to="/shop" mt={6}>BROWSE THE SHOP</Button>
    </Container>
  );

  return (
    <Container maxW="5xl" py={12}>
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} mb={8}>Your cart</Heading>
      <Stack spacing={0} divider={<Divider />}>
        {items.map((i) => (
          <Flex key={i.id} gap={{ base: 4, md: 6 }} py={5} align="center" wrap="wrap">
            <Flex boxSize="88px" bg="#fafafa" borderRadius="md" align="center" justify="center" overflow="hidden" flexShrink={0}>
              {i.imageUrl ? <Image src={i.imageUrl} alt={i.name} maxH="100%" maxW="100%" objectFit="contain" p={2} />
                : <Heading size="lg" color="#d8cfc8" aria-hidden>{i.name[0]}</Heading>}
            </Flex>
            <Box flex="1" minW="160px">
              <Link as={RouterLink} to={`/shop/${i.id}`} fontWeight="500">{i.name}</Link>
              <Text color="gray.600" fontSize="sm">{money(i.price)}</Text>
              <Button size="xs" variant="link" colorScheme="red" mt={1} onClick={() => remove(i.id)}>Remove</Button>
            </Box>
            <NumberInput size="md" w="90px" min={1} max={99} value={i.qty} onChange={(_, n) => setQty(i.id, Number.isNaN(n) ? 1 : n)} bg="white">
              <NumberInputField aria-label={`Quantity for ${i.name}`} borderRadius="none" />
            </NumberInput>
            <Text w="110px" textAlign="right" fontWeight="600">{money(i.price * i.qty)}</Text>
          </Flex>
        ))}
      </Stack>
      <Flex justify="flex-end" mt={8}>
        <Box layerStyle="stitched" p={6} minW={{ md: '320px' }} w={{ base: 'full', md: 'auto' }}>
          <Flex justify="space-between" fontSize="lg" fontWeight="600"><Text>Subtotal</Text><Text>{money(total)}</Text></Flex>
          <Text fontSize="sm" color="gray.600" mt={2}>Delivery is confirmed when we confirm your order.</Text>
          <Button as={RouterLink} to="/checkout" w="full" mt={5} size="lg">CHECKOUT</Button>
          <Button as={RouterLink} to="/shop" w="full" mt={3} variant="outline">Continue shopping</Button>
        </Box>
      </Flex>
    </Container>
  );
}
